import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExtensionRequest, ExtensionRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { CreateExtensionRequestDto } from './dto/create-extension-request.dto';

@Injectable()
export class ExtensionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  listByUser(userId: string): Promise<ExtensionRequest[]> {
    return this.prisma.extensionRequest.findMany({
      where: { userId },
      include: {
        order: {
          include: {
            package: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createExtensionRequest(
    userId: string,
    payload: CreateExtensionRequestDto,
  ): Promise<ExtensionRequest> {
    // Siparişin kullanıcıya ait olduğunu kontrol et
    const order = await this.prisma.order.findFirst({
      where: {
        id: payload.orderId,
        buyerId: userId,
      },
      include: {
        package: true,
      },
    });

    if (!order) {
      throw new AppError('Sipariş bulunamadı veya size ait değil.', 404, ErrorCodes.ORDER_NOT_FOUND);
    }

    // Extension request oluştur
    const extensionRequest = await this.prisma.extensionRequest.create({
      data: {
        orderId: order.id,
        userId,
        status: ExtensionRequestStatus.PENDING,
        amount: order.package.price,
        currency: order.package.currency,
        months: 1,
      },
    });

    return extensionRequest;
  }

  async updateExtensionStatus(
    id: string,
    status: ExtensionRequestStatus,
  ): Promise<ExtensionRequest> {
    const extension = await this.prisma.extensionRequest.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!extension) {
      throw new AppError('Extension request bulunamadı.', 404, ErrorCodes.ORDER_NOT_FOUND);
    }

    // Eğer status PAID ise, siparişin validUntil'ini 1 ay uzat
    if (status === ExtensionRequestStatus.PAID) {
      const currentValidUntil = extension.order.validUntil || new Date();
      const newValidUntil = new Date(currentValidUntil);
      newValidUntil.setMonth(newValidUntil.getMonth() + extension.months);

      await this.prisma.order.update({
        where: { id: extension.orderId },
        data: {
          validUntil: newValidUntil,
        },
      });
    }

    // Extension request güncelle
    const updated = await this.prisma.extensionRequest.update({
      where: { id },
      data: {
        status,
        paidAt: status === ExtensionRequestStatus.PAID ? new Date() : undefined,
      },
    });

    return updated;
  }
}
