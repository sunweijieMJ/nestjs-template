import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OrderStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  CLOSED = 'CLOSED',
}

export enum PaymentChannel {
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
}

export class Order {
  @ApiProperty({ example: 1 })
  id: number | string;

  @ApiProperty({ example: 1 })
  userId: number | string;

  @ApiProperty({ example: 'ORD20250112123456789' })
  orderNo: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.UNPAID })
  status: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentChannel })
  paymentChannel?: PaymentChannel;

  @ApiPropertyOptional({ example: '4200001234567890' })
  transactionId?: string;

  @ApiProperty({ example: 9900, description: 'Total amount in cents' })
  totalAmount: number;

  @ApiPropertyOptional({ example: 9900, description: 'Paid amount in cents' })
  paidAmount?: number;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  refundedAt?: Date;

  @ApiPropertyOptional()
  closedAt?: Date;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}
