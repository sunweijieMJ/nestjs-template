import { Injectable, Logger, NotFoundException, UnprocessableEntityException, HttpStatus } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { ProductCatalog } from './infrastructure/catalog/product-catalog';
import { PaymentTradeCloser } from './payment-trade-closer';
import { Order, OrderStatus, PaymentChannel, ORDER_PAYMENT_TIMEOUT_MS } from './domain/order';
import { OrderItem } from './domain/order-item';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { IPaginationOptions } from '../../common/types/pagination-options';
import { isUniqueViolationOf } from '../../common/utils/exceptions.util';

const ORDER_NO_MAX_ATTEMPTS = 3;

/** 金额列为 int4，单位分 */
const MAX_ORDER_AMOUNT = 2_147_483_647;

/**
 * paid：本次回调把订单置为已支付；duplicate：同一笔交易的重复通知；
 * conflict：订单已由另一笔交易支付，本次是重复支付
 */
export type PaymentOutcome = 'paid' | 'duplicate' | 'conflict';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productCatalog: ProductCatalog,
    private readonly paymentTradeCloser: PaymentTradeCloser,
  ) {}

  async create(userId: number | string, createOrderDto: CreateOrderDto): Promise<Order & { items: OrderItem[] }> {
    this.logger.log(`Creating order for user: ${userId}`);

    const productIds = [...new Set(createOrderDto.items.map((item) => item.productId))];
    const products = new Map(
      (await this.productCatalog.findByIds(productIds))
        .filter((p) => Number.isSafeInteger(p.unitPrice) && p.unitPrice > 0)
        .map((p) => [p.id, p]),
    );
    const missing = productIds.filter((id) => !products.has(id));
    if (missing.length > 0) {
      this.logger.warn(`Products unavailable for order: ${missing.join(', ')}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          items: 'productNotFound',
        },
      });
    }

    const items = createOrderDto.items.map((item) => {
      const product = products.get(item.productId)!;
      return {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        unitPrice: product.unitPrice,
        quantity: item.quantity,
        subtotal: product.unitPrice * item.quantity,
        metadata: item.metadata,
      };
    });
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    if (totalAmount > MAX_ORDER_AMOUNT) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          items: 'orderAmountTooLarge',
        },
      });
    }

    for (let attempt = 1; ; attempt++) {
      const orderNo = this.generateOrderNo();
      try {
        // 订单与明细在同一事务内写入
        const order = await this.orderRepository.createWithItems(
          {
            userId,
            orderNo,
            status: OrderStatus.UNPAID,
            totalAmount,
            expiresAt: new Date(Date.now() + ORDER_PAYMENT_TIMEOUT_MS),
            metadata: createOrderDto.metadata,
          },
          items,
        );
        this.logger.log(`Order created: ${orderNo}`);
        return order;
      } catch (error) {
        if (attempt < ORDER_NO_MAX_ATTEMPTS && isUniqueViolationOf(error, 'UQ_order_orderNo')) {
          this.logger.warn(`Order number collision, retrying (attempt ${attempt}/${ORDER_NO_MAX_ATTEMPTS})`);
          continue;
        }
        throw error;
      }
    }
  }

  async findManyWithPagination(
    userId: number | string,
    queryOrderDto: QueryOrderDto,
    paginationOptions: IPaginationOptions,
  ): Promise<Order[]> {
    return this.orderRepository.findManyWithPagination({
      userId,
      filterOptions: queryOrderDto,
      paginationOptions,
    });
  }

  async findOne(id: number | string, userId: number | string): Promise<Order & { items: OrderItem[] }> {
    const order = await this.orderRepository.findByIdAndUserIdWithItems(id, userId);

    if (!order) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: 'orderNotFound',
      });
    }

    return order;
  }

  async findByOrderNo(orderNo: string): Promise<Order | null> {
    return this.orderRepository.findByOrderNo(orderNo);
  }

  /**
   * 按订单号查询当前用户的订单，不存在或不属于该用户时抛出 404
   */
  async findOwnedByOrderNo(orderNo: string, userId: number | string): Promise<Order> {
    const order = await this.orderRepository.findByOrderNo(orderNo);

    if (!order || String(order.userId) !== String(userId)) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: 'orderNotFound',
      });
    }

    return order;
  }

  /**
   * 查询当前用户待支付且未过支付截止时间的订单，否则抛出 422
   */
  async findPayableOrder(orderNo: string, userId: number | string): Promise<Order> {
    const order = await this.findOwnedByOrderNo(orderNo, userId);

    if (order.status !== OrderStatus.UNPAID || (order.expiresAt && order.expiresAt <= new Date())) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          order: 'orderNotPayable',
        },
      });
    }

    return order;
  }

  /**
   * 查询可退款的订单：已支付且退款金额（分）不超过实付金额
   */
  async findRefundableOrder(orderNo: string, refundAmount: number): Promise<Order> {
    const order = await this.orderRepository.findByOrderNo(orderNo);

    if (!order) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: 'orderNotFound',
      });
    }

    if (order.status !== OrderStatus.PAID) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          order: 'orderNotRefundable',
        },
      });
    }

    if (refundAmount > (order.paidAmount ?? order.totalAmount)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          refundAmount: 'exceedsPaidAmount',
        },
      });
    }

    return order;
  }

  /**
   * 标记订单已全额退款
   */
  async markRefunded(order: Order): Promise<void> {
    await this.orderRepository.update(order.id, {
      status: OrderStatus.REFUNDED,
      refundedAt: new Date(),
    });
    this.logger.log(`Order ${order.orderNo} marked as REFUNDED`);
  }

  async updatePaymentStatus(
    orderNo: string,
    status: OrderStatus,
    paymentData: {
      paymentChannel: PaymentChannel;
      transactionId: string;
      paidAmount: number;
    },
  ): Promise<{ order: Order; outcome: PaymentOutcome }> {
    this.logger.log(`Updating payment status for order: ${orderNo} to ${status}`);

    const existing = await this.orderRepository.findByOrderNo(orderNo);
    if (existing?.status === OrderStatus.CLOSED) {
      this.logger.warn(`Order ${orderNo} was closed before payment succeeded, reopening as ${status}`);
    }
    if (existing && paymentData.paidAmount !== existing.totalAmount) {
      this.logger.error(
        `Paid amount mismatch for order ${orderNo}: paid ${paymentData.paidAmount}, expected ${existing.totalAmount}`,
      );
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          paidAmount: 'amountMismatch',
        },
      });
    }

    const { updated, order } = await this.orderRepository.updatePaymentStatus(orderNo, status, {
      ...paymentData,
      paidAt: new Date(),
    });

    if (!order) {
      this.logger.warn(`Order not found: ${orderNo}`);
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: 'orderNotFound',
      });
    }

    if (updated) {
      this.logger.log(`Order ${orderNo} payment status updated to ${status}`);
      return { order, outcome: 'paid' };
    }

    if (order.paymentChannel === paymentData.paymentChannel && order.transactionId === paymentData.transactionId) {
      return { order, outcome: 'duplicate' };
    }

    this.logger.error(
      `Order ${orderNo} already settled by ${order.paymentChannel}/${order.transactionId}, ` +
        `received another payment ${paymentData.paymentChannel}/${paymentData.transactionId}`,
    );
    return { order, outcome: 'conflict' };
  }

  async cancelOrder(id: number | string, userId: number | string): Promise<void> {
    const order = await this.orderRepository.findByIdAndUserId(id, userId);

    if (!order) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: 'orderNotFound',
      });
    }

    if (order.status !== OrderStatus.UNPAID) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          order: 'cannotCancelPaidOrder',
        },
      });
    }

    const closed = await this.orderRepository.closeIfUnpaid(id, userId);
    if (!closed) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          order: 'cannotCancelPaidOrder',
        },
      });
    }

    this.logger.log(`Order ${order.orderNo} cancelled by user ${userId}`);
    void this.paymentTradeCloser.closeTrades(order.orderNo);
  }

  async closeExpiredOrders(): Promise<number> {
    const closed = await this.orderRepository.closeExpiredUnpaid(new Date());
    if (closed > 0) {
      this.logger.log(`Closed ${closed} expired unpaid orders`);
    }
    return closed;
  }

  async count(userId: number | string, queryOrderDto?: QueryOrderDto): Promise<number> {
    return this.orderRepository.countByUserId(userId, queryOrderDto);
  }

  /**
   * 生成加密安全的订单号
   * 格式: ORD + 时间戳(精确到秒) + 6位随机字符
   */
  private generateOrderNo(): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const random = randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
    return `ORD${timestamp}${random}`;
  }
}
