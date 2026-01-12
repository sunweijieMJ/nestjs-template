import { Injectable, Logger, NotFoundException, UnprocessableEntityException, HttpStatus } from '@nestjs/common';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { OrderItemRepository } from './infrastructure/persistence/order-item.repository';
import { Order, OrderStatus, PaymentChannel } from './domain/order';
import { OrderItem } from './domain/order-item';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { IPaginationOptions } from '../../common/types/pagination-options';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async create(userId: number | string, createOrderDto: CreateOrderDto): Promise<Order & { items: OrderItem[] }> {
    this.logger.log(`Creating order for user: ${userId}`);

    // Calculate total amount
    const totalAmount = createOrderDto.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Generate order number
    const orderNo = this.generateOrderNo();

    // Create order
    const order = await this.orderRepository.create({
      userId,
      orderNo,
      status: OrderStatus.UNPAID,
      totalAmount,
      metadata: createOrderDto.metadata,
    });

    // Create order items
    const orderItems = await this.orderItemRepository.createMany(
      createOrderDto.items.map((item) => ({
        orderId: order.id,
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

    return { ...order, items: orderItems };
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
    const order = await this.orderRepository.findByIdAndUserId(id, userId);

    if (!order) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: 'orderNotFound',
      });
    }

    const items = await this.orderItemRepository.findByOrderId(order.id);

    return { ...order, items };
  }

  async findByOrderNo(orderNo: string): Promise<Order | null> {
    return this.orderRepository.findByOrderNo(orderNo);
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

    await this.orderRepository.update(id, {
      status: OrderStatus.CLOSED,
      closedAt: new Date(),
    });

    this.logger.log(`Order ${order.orderNo} cancelled by user ${userId}`);
  }

  async count(userId: number | string, queryOrderDto?: QueryOrderDto): Promise<number> {
    return this.orderRepository.countByUserId(userId, queryOrderDto);
  }

  private generateOrderNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${timestamp}${random}`;
  }
}
