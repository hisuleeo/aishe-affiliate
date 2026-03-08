import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

// Sipariş statüsü güncelleme isteği
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
