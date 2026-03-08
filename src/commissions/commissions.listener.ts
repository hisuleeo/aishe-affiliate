import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderPaidEvent } from '../orders/events/order-paid.event';
import { CommissionsService } from './commissions.service';

// OrderPaidEvent'i dinleyen CommissionListener
@Injectable()
export class CommissionListener {
  constructor(private readonly commissionsService: CommissionsService) {}

  @OnEvent('order.paid')
  async handleOrderPaid(event: OrderPaidEvent) {
    await this.commissionsService.calculateCommission(event.orderId);
  }
}
