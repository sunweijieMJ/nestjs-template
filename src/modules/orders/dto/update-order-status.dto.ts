import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus, PaymentChannel } from '../domain/order';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentChannel })
  @IsOptional()
  @IsEnum(PaymentChannel)
  paymentChannel?: PaymentChannel;

  @ApiPropertyOptional({ example: '4200001234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  transactionId?: string;
}
