import { Injectable, Logger, NotFoundException, UnprocessableEntityException, HttpStatus } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { Order, OrderStatus, PaymentChannel } from './domain/order';
import { OrderItem } from './domain/order-item';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { IPaginationOptions } from '../../common/types/pagination-options';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  async create(userId: number | string, createOrderDto: CreateOrderDto): Promise<Order & { items: OrderItem[] }> {
    this.logger.log(`Creating order for user: ${userId}`);

    // Calculate total amount
    const totalAmount = createOrderDto.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Generate order number
    const orderNo = this.generateOrderNo();

    // 订单与明细在同一事务内写入
    const order = await this.orderRepository.createWithItems(
      {
        userId,
        orderNo,
        status: OrderStatus.UNPAID,
        totalAmount,
        metadata: createOrderDto.metadata,
      },
      createOrderDto.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.unitPrice * item.quantity,
        metadata: item.metadata,
      })),
    );

    this.logger.log(`Order created: ${orderNo}`);

    return order;
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
   * 查询当前用户待支付的订单，非待支付状态时抛出 422
   */
  async findPayableOrder(orderNo: string, userId: number | string): Promise<Order> {
    const order = await this.findOwnedByOrderNo(orderNo, userId);

    if (order.status !== OrderStatus.UNPAID) {
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
  ): Promise<Order> {
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

    const order = await this.orderRepository.updatePaymentStatus(orderNo, status, {
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

    this.logger.log(`Order ${orderNo} payment status updated to ${status}`);
    return order;
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
