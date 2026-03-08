import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  CommissionStatus,
  ExtensionRequestStatus,
  OrderAttributionType,
  PayoutStatus,
} from '@prisma/client';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

// Admin-only test endpointleri
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  // Sadece ADMIN rolü erişebilir
  @Get('users')
  @Roles('ADMIN')
  listUsers() {
    return this.usersService.list();
  }

  @Get('orders')
  @Roles('ADMIN')
  listOrders(@Query('attribution') attribution?: string) {
    const attributionMap: Record<string, OrderAttributionType> = {
      affiliate: OrderAttributionType.AFFILIATE,
      referral: OrderAttributionType.REFERRAL,
      none: OrderAttributionType.NONE,
    };

    const attributionType = attribution ? attributionMap[attribution] : undefined;
    if (attribution && !attributionType) {
      throw new AppError('Attribution filtresi geçersiz.', 400, ErrorCodes.INTERNAL_ERROR);
    }

    return this.ordersService.listAll(attributionType);
  }

  @Get('affiliate-links')
  @Roles('ADMIN')
  async listAffiliateLinks() {
    const links = await this.prisma.affiliateLink.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        affiliate: { select: { id: true, email: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });

    const withMetrics = await Promise.all(
      links.map(async (link) => {
        const [totalClicks, topSource, topMedium, topCampaign] = await Promise.all([
          this.prisma.click.count({ where: { affiliateLinkId: link.id } }),
          this.prisma.click.groupBy({
            by: ['utmSource'],
            where: { affiliateLinkId: link.id, utmSource: { not: null } },
            _count: { utmSource: true },
            orderBy: { _count: { utmSource: 'desc' } },
            take: 1,
          }),
          this.prisma.click.groupBy({
            by: ['utmMedium'],
            where: { affiliateLinkId: link.id, utmMedium: { not: null } },
            _count: { utmMedium: true },
            orderBy: { _count: { utmMedium: 'desc' } },
            take: 1,
          }),
          this.prisma.click.groupBy({
            by: ['utmCampaign'],
            where: { affiliateLinkId: link.id, utmCampaign: { not: null } },
            _count: { utmCampaign: true },
            orderBy: { _count: { utmCampaign: 'desc' } },
            take: 1,
          }),
        ]);

        return {
          ...link,
          metrics: {
            totalClicks,
            topSource: topSource[0]?.utmSource ?? null,
            topMedium: topMedium[0]?.utmMedium ?? null,
            topCampaign: topCampaign[0]?.utmCampaign ?? null,
          },
        };
      }),
    );

    return withMetrics;
  }

  @Get('affiliate-links/:id/metrics')
  @Roles('ADMIN')
  async getAffiliateLinkMetrics(@Param('id') id: string) {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { id },
      include: {
        affiliate: { select: { id: true, email: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });

    if (!link) {
      throw new AppError('Affiliate link bulunamadı.', 404, ErrorCodes.INTERNAL_ERROR);
    }

    const [
      totalClicks,
      uniqueCookieGroups,
      lastClickedAt,
      topSources,
      topMediums,
      topCampaigns,
    ] =
      await Promise.all([
        this.prisma.click.count({ where: { affiliateLinkId: id } }),
        this.prisma.click.groupBy({
          by: ['cookieId'],
          where: { affiliateLinkId: id },
        }),
        this.prisma.click.aggregate({
          where: { affiliateLinkId: id },
          _max: { clickedAt: true },
        }),
        this.prisma.click.groupBy({
          by: ['utmSource'],
          where: { affiliateLinkId: id, utmSource: { not: null } },
          _count: { utmSource: true },
          orderBy: { _count: { utmSource: 'desc' } },
          take: 5,
        }),
        this.prisma.click.groupBy({
          by: ['utmMedium'],
          where: { affiliateLinkId: id, utmMedium: { not: null } },
          _count: { utmMedium: true },
          orderBy: { _count: { utmMedium: 'desc' } },
          take: 5,
        }),
        this.prisma.click.groupBy({
          by: ['utmCampaign'],
          where: { affiliateLinkId: id, utmCampaign: { not: null } },
          _count: { utmCampaign: true },
          orderBy: { _count: { utmCampaign: 'desc' } },
          take: 5,
        }),
      ]);

    return {
      link,
      totals: {
        totalClicks,
        uniqueCookies: uniqueCookieGroups.length,
        lastClickedAt: lastClickedAt._max.clickedAt ?? null,
      },
      utm: {
        sources: topSources.map((item) => ({
          value: item.utmSource,
          count: item._count?.utmSource ?? 0,
        })),
        mediums: topMediums.map((item) => ({
          value: item.utmMedium,
          count: item._count?.utmMedium ?? 0,
        })),
        campaigns: topCampaigns.map((item) => ({
          value: item.utmCampaign,
          count: item._count?.utmCampaign ?? 0,
        })),
      },
    };
  }

  // Extension Requests Management
  @Get('extension-requests')
  @Roles('ADMIN')
  async listExtensionRequests(@Query('status') status?: string) {
    const statusFilter = status
      ? { status: status.toUpperCase() as ExtensionRequestStatus }
      : {};

    const requests = await this.prisma.extensionRequest.findMany({
      where: statusFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        order: {
          select: {
            id: true,
            packageId: true,
            aisheId: true,
            status: true,
          },
        },
      },
    });

    return requests;
  }

  @Patch('extension-requests/:id/approve')
  @Roles('ADMIN')
  async approveExtensionRequest(@Param('id') id: string) {
    const request = await this.prisma.extensionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new AppError(
        'Extension request bulunamadı.',
        404,
        ErrorCodes.INTERNAL_ERROR,
      );
    }

    if (request.status !== ExtensionRequestStatus.PENDING) {
      throw new AppError(
        'Sadece pending durumundaki istekler onaylanabilir.',
        400,
        ErrorCodes.INTERNAL_ERROR,
      );
    }

    const updated = await this.prisma.extensionRequest.update({
      where: { id },
      data: {
        status: ExtensionRequestStatus.PAID,
        paidAt: new Date(),
      },
    });

    return updated;
  }

  @Patch('extension-requests/:id/reject')
  @Roles('ADMIN')
  async rejectExtensionRequest(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const request = await this.prisma.extensionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new AppError(
        'Extension request bulunamadı.',
        404,
        ErrorCodes.INTERNAL_ERROR,
      );
    }

    if (request.status !== ExtensionRequestStatus.PENDING) {
      throw new AppError(
        'Sadece pending durumundaki istekler reddedilebilir.',
        400,
        ErrorCodes.INTERNAL_ERROR,
      );
    }

    const updated = await this.prisma.extensionRequest.update({
      where: { id },
      data: {
        status: ExtensionRequestStatus.FAILED,
      },
    });

    // TODO: Kullanıcıya red nedeni bildirimi gönder (body.reason)

    return updated;
  }

  // Payout Management
  @Get('payouts')
  @Roles('ADMIN')
  async listPayouts(@Query('status') status?: string) {
    const statusFilter = status
      ? { status: status.toUpperCase() as PayoutStatus }
      : {};

    const payouts = await this.prisma.affiliatePayout.findMany({
      where: statusFilter,
      orderBy: { periodEnd: 'desc' },
      include: {
        affiliate: { select: { id: true, email: true, name: true } },
        payoutItems: {
          include: {
            commission: {
              select: {
                id: true,
                amount: true,
                currency: true,
                type: true,
                status: true,
                conversion: {
                  select: {
                    id: true,
                    externalOrderId: true,
                    amount: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return payouts;
  }

  @Post('payouts/:id/approve')
  @Roles('ADMIN')
  async approvePayout(@Param('id') id: string) {
    const payout = await this.prisma.affiliatePayout.findUnique({
      where: { id },
      include: {
        payoutItems: {
          include: { commission: true },
        },
      },
    });

    if (!payout) {
      throw new AppError('Payout bulunamadı.', 404, ErrorCodes.INTERNAL_ERROR);
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new AppError(
        'Sadece pending durumundaki payout\'lar onaylanabilir.',
        400,
        ErrorCodes.INTERNAL_ERROR,
      );
    }

    // Update payout status to PROCESSING first
    const updated = await this.prisma.affiliatePayout.update({
      where: { id },
      data: {
        status: PayoutStatus.PROCESSING,
      },
    });

    return updated;
  }

  @Post('payouts/:id/complete')
  @Roles('ADMIN')
  async completePayout(@Param('id') id: string) {
    const payout = await this.prisma.affiliatePayout.findUnique({
      where: { id },
      include: {
        payoutItems: {
          include: { commission: true },
        },
      },
    });

    if (!payout) {
      throw new AppError('Payout bulunamadı.', 404, ErrorCodes.INTERNAL_ERROR);
    }

    if (payout.status !== PayoutStatus.PROCESSING) {
      throw new AppError(
        'Sadece processing durumundaki payout\'lar tamamlanabilir.',
        400,
        ErrorCodes.INTERNAL_ERROR,
      );
    }

    // Mark as PAID and set paidAt
    const updated = await this.prisma.affiliatePayout.update({
      where: { id },
      data: {
        status: PayoutStatus.PAID,
        paidAt: new Date(),
      },
    });

    // TODO: Create ledger entries for each commission
    // TODO: Send notification to affiliate

    return updated;
  }

  @Post('payouts/:id/reject')
  @Roles('ADMIN')
  async rejectPayout(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const payout = await this.prisma.affiliatePayout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new AppError('Payout bulunamadı.', 404, ErrorCodes.INTERNAL_ERROR);
    }

    if (payout.status === PayoutStatus.PAID) {
      throw new AppError(
        'Ödenen payout\'lar reddedilemez.',
        400,
        ErrorCodes.INTERNAL_ERROR,
      );
    }

    const updated = await this.prisma.affiliatePayout.update({
      where: { id },
      data: {
        status: PayoutStatus.FAILED,
      },
    });

    // TODO: Send notification to affiliate with reason (body.reason)

    return updated;
  }

  @Get('commissions/unpaid')
  @Roles('ADMIN')
  async listUnpaidCommissions() {
    // Get all APPROVED commissions that are not yet in any payout
    const unpaidCommissions = await this.prisma.commission.findMany({
      where: {
        status: CommissionStatus.APPROVED,
        payoutItems: { none: {} },
      },
      include: {
        affiliate: { select: { id: true, email: true, name: true } },
        conversion: {
          select: {
            id: true,
            externalOrderId: true,
            amount: true,
          },
        },
      },
      orderBy: { conversionId: 'desc' },
    });

    // Group by affiliate
    const groupedByAffiliate = unpaidCommissions.reduce(
      (acc, commission) => {
        const affiliateId = commission.affiliateId;
        if (!acc[affiliateId]) {
          acc[affiliateId] = {
            affiliate: commission.affiliate,
            commissions: [],
            totalAmount: 0,
            currency: commission.currency,
          };
        }
        acc[affiliateId].commissions.push(commission);
        acc[affiliateId].totalAmount += Number(commission.amount);
        return acc;
      },
      {} as Record<
        string,
        {
          affiliate: { id: string; email: string; name: string | null };
          commissions: any[];
          totalAmount: number;
          currency: string;
        }
      >,
    );

    return Object.values(groupedByAffiliate);
  }
}
