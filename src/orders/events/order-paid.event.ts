import { OrderStatus, Prisma } from '@prisma/client';

// Sipariş PAID olduğunda yayınlanan event
export class OrderPaidEvent {
  orderId!: string;
  buyerId!: string;
  packageId!: string;
  amount!: Prisma.Decimal;
  currency!: string;
  status!: OrderStatus;
  commissionRate!: Prisma.Decimal;
  affiliateId?: string;
  referralUserId?: string;

  constructor(payload: OrderPaidEvent) {
    Object.assign(this, payload);
  }
}
