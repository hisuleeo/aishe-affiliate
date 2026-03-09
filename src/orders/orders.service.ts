import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order, OrderAttributionType, OrderStatus, Prisma } from '@prisma/client';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { PackagesService } from '../packages/packages.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersRepository } from './orders.repository';
import { OrderCreatedEvent } from './events/order-created.event';
import { OrderPaidEvent } from './events/order-paid.event';

// Sipariş iş mantığı
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly packagesService: PackagesService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  listByBuyer(buyerId: string): Promise<Order[]> {
    return this.ordersRepository.findByBuyer(buyerId);
  }

  listAll(attributionType?: OrderAttributionType): Promise<Order[]> {
    return this.ordersRepository.findAll(attributionType);
  }

  async createOrder(buyerId: string, payload: CreateOrderDto): Promise<Order> {
  const pkg = await this.packagesService.getById(payload.packageId);

    const attribution = await this.resolveAttribution(payload.affiliateId, payload.referralCode);

    // validUntil: 1 ay sonra
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1);

    // Custom paketlerde fiyat hesaplama: base(25) + özellik sayısı × 10 + limitSize × 50
    let calculatedAmount = Number(pkg.price);
    if (pkg.isCustom) {
      const BASE_PRICE = 25;
      const FEATURE_PRICE = 10;
      const LIMIT_PER_UNIT = 50;
      const featureCount = payload.selectedOptions?.length ?? 0;
      const limitSize = payload.limitSize ?? 0.5;
      calculatedAmount = BASE_PRICE + (featureCount * FEATURE_PRICE) + (limitSize * LIMIT_PER_UNIT);
    }

  const order = await this.ordersRepository.create({
      buyer: { connect: { id: buyerId } },
      package: { connect: { id: pkg.id } },
      status: OrderStatus.PENDING,
      amount: calculatedAmount,
      currency: pkg.currency,
      attributionType: attribution.type,
      affiliateId: attribution.affiliateId,
      referralCode: attribution.referralCode,
      aisheId: payload.aisheId,
      selectedOptions: payload.selectedOptions || undefined,
      needsInvoice: payload.needsInvoice,
      invoiceInfo: payload.invoiceInfo ? (payload.invoiceInfo as any) : undefined,
      validUntil,
      referralUser: attribution.referralUserId
        ? { connect: { id: attribution.referralUserId } }
        : undefined,
    });

    this.eventEmitter.emit(
      'order.created',
      new OrderCreatedEvent({
        orderId: order.id,
        buyerId,
        packageId: pkg.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        attributionType: order.attributionType,
        affiliateId: order.affiliateId ?? undefined,
        referralUserId: order.referralUserId ?? undefined,
      }),
    );

    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order bulunamadı.', 404, ErrorCodes.ORDER_NOT_FOUND);
    }

    if (order.status === status) {
      return order;
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new AppError(
        'Sadece pending siparişler güncellenebilir.',
        400,
        ErrorCodes.ORDER_STATUS_INVALID,
      );
    }

    const updated = await this.ordersRepository.updateStatus(orderId, status);

    if (status === OrderStatus.PAID) {
      const pkg = await this.packagesService.getById(order.packageId);

      this.eventEmitter.emit(
        'order.paid',
        new OrderPaidEvent({
          orderId: updated.id,
          buyerId: updated.buyerId,
          packageId: updated.packageId,
          amount: updated.amount as Prisma.Decimal,
          currency: updated.currency,
          status: updated.status,
          commissionRate: pkg.commissionRate,
          affiliateId: updated.affiliateId ?? undefined,
          referralUserId: updated.referralUserId ?? undefined,
        }),
      );
    }

    return updated;
  }

  private async resolveAttribution(affiliateId?: string, referralCode?: string) {
    if (referralCode) {
      const referral = await this.prisma.referralCode.findUnique({
        where: { code: referralCode },
      });

      if (!referral) {
        throw new AppError(
          'Referral kodu geçersiz.',
          400,
          ErrorCodes.ORDER_ATTRIBUTION_INVALID,
        );
      }

      return {
        type: OrderAttributionType.REFERRAL,
        referralCode,
        referralUserId: referral.userId,
        affiliateId: undefined,
      };
    }

    if (affiliateId) {
      const affiliate = await this.prisma.user.findUnique({ where: { id: affiliateId } });
      if (!affiliate) {
        throw new AppError(
          'Affiliate kullanıcı bulunamadı.',
          400,
          ErrorCodes.ORDER_ATTRIBUTION_INVALID,
        );
      }

      return {
        type: OrderAttributionType.AFFILIATE,
        referralCode: undefined,
        referralUserId: undefined,
        affiliateId,
      };
    }

    return {
      type: OrderAttributionType.NONE,
      referralCode: undefined,
      referralUserId: undefined,
      affiliateId: undefined,
    };
  }
}
