import { OrderAttributionType, OrderStatus, Prisma } from '@prisma/client';

// Order oluşturulduğunda yayınlanan event
export class OrderCreatedEvent {
  orderId!: string;
  buyerId!: string;
  packageId!: string;
  amount!: Prisma.Decimal;
  currency!: string;
  status!: OrderStatus;
  attributionType!: OrderAttributionType;
  affiliateId?: string;
  referralUserId?: string;

  constructor(payload: OrderCreatedEvent) {
    Object.assign(this, payload);
  }
}
