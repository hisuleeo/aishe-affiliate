import { Injectable } from '@nestjs/common';
import { Order, OrderAttributionType, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Sipariş repository: veritabanı işlemleri
@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.OrderCreateInput): Promise<Order> {
    return this.prisma.order.create({ data });
  }

  findById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({ where: { id } });
  }

  findByBuyer(buyerId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll(attributionType?: OrderAttributionType): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: attributionType ? { attributionType } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}
