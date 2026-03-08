import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

class CreateSettingDto {
  @IsString()
  @MaxLength(100)
  key!: string;

  @IsString()
  value!: string;

  @IsString()
  @IsOptional()
  @IsIn(['string', 'boolean', 'number', 'json'])
  type?: string;

  @IsString()
  @IsOptional()
  @IsIn(['general', 'maintenance', 'notification'])
  category?: string;
}

class UpdateSettingDto {
  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  @IsIn(['string', 'boolean', 'number', 'json'])
  type?: string;

  @IsString()
  @IsOptional()
  @IsIn(['general', 'maintenance', 'notification'])
  category?: string;
}

class GetLogsQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  limit?: string;

  @IsOptional()
  offset?: string;
}

class ReportsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

  // ============ Settings API ============

  @Get('settings')
  @Roles('ADMIN')
  async getSettings(@Query('category') category?: string) {
    const where = category ? { category } : {};

    const settings = await this.prisma.systemSetting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    return settings;
  }

  @Get('settings/:key')
  @Roles('ADMIN')
  async getSetting(@Param('key') key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new AppError('Setting not found', 404, ErrorCodes.INTERNAL_ERROR);
    }

    return setting;
  }

  @Post('settings')
  @Roles('ADMIN')
  async createSetting(@Body() dto: CreateSettingDto) {
    const setting = await this.prisma.systemSetting.create({
      data: {
        key: dto.key,
        value: dto.value,
        type: dto.type || 'string',
        category: dto.category || 'general',
      },
    });

    return setting;
  }

  @Patch('settings/:key')
  @Roles('ADMIN')
  async updateSetting(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new AppError('Setting not found', 404, ErrorCodes.INTERNAL_ERROR);
    }

    const setting = await this.prisma.systemSetting.update({
      where: { key },
      data: {
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.type && { type: dto.type }),
        ...(dto.category && { category: dto.category }),
      },
    });

    return setting;
  }

  @Delete('settings/:key')
  @Roles('ADMIN')
  async deleteSetting(@Param('key') key: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new AppError('Setting not found', 404, ErrorCodes.INTERNAL_ERROR);
    }

    await this.prisma.systemSetting.delete({
      where: { key },
    });

    return { success: true };
  }

  // ============ Logs API ============

  @Get('logs')
  @Roles('ADMIN')
  async getLogs(@Query() query: GetLogsQueryDto) {
    const limit = parseInt(query.limit || '100');
    const offset = parseInt(query.offset || '0');

    const where: any = {};
    if (query.action) {
      where.action = query.action;
    }
    if (query.actorId) {
      where.actorId = query.actorId;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
    };
  }

  @Get('logs/actions')
  @Roles('ADMIN')
  async getLogActions() {
    const actions = await this.prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });

    return actions.map((a) => a.action);
  }

  // ============ Reports API ============

  @Get('reports/overview')
  @Roles('ADMIN')
  async getReportsOverview(@Query() query: ReportsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const whereWithDate = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [
      totalUsers,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      // Total users
      this.prisma.user.count({
        where: whereWithDate,
      }),

      // Total orders
      this.prisma.order.count({
        where: whereWithDate,
      }),

      // Total revenue
      this.prisma.order.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          ...whereWithDate,
        },
      }),
    ]);

    return {
      summary: {
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
    };
  }

  @Get('reports/users')
  @Roles('ADMIN')
  async getUsersReport(@Query() query: ReportsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const users = await this.prisma.user.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            affiliateLinks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  @Get('reports/orders')
  @Roles('ADMIN')
  async getOrdersReport(@Query() query: ReportsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const orders = await this.prisma.order.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  @Get('reports/revenue')
  @Roles('ADMIN')
  async getRevenueReport(@Query() query: ReportsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const [daily, byPackage, byAttributionType] = await Promise.all([
      // Daily revenue
      this.prisma.$queryRaw<
        Array<{ date: string; revenue: string; orders: number }>
      >`
        SELECT 
          created_at::date as date,
          SUM(amount)::text as revenue,
          COUNT(*)::int as orders
        FROM orders
        WHERE status = 'PAID'
          ${startDate ? this.prisma.$queryRawUnsafe('AND created_at >= $1', startDate) : this.prisma.$queryRawUnsafe('')}
          ${endDate ? this.prisma.$queryRawUnsafe('AND created_at <= $1', endDate) : this.prisma.$queryRawUnsafe('')}
        GROUP BY created_at::date
        ORDER BY date DESC
        LIMIT 90
      `,

      // Revenue by package
      this.prisma.order.groupBy({
        by: ['packageId'],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'PAID',
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
      }),

      // Revenue by attribution type
      this.prisma.order.groupBy({
        by: ['attributionType'],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'PAID',
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
      }),
    ]);

    // Fetch package names
    const packageIds = byPackage.map((item) => item.packageId).filter(Boolean);
    const packages = await this.prisma.package.findMany({
      where: { id: { in: packageIds as string[] } },
      select: { id: true, name: true },
    });

    const packageMap = new Map(packages.map((p) => [p.id, p.name]));

    return {
      daily: daily.map((item) => ({
        date: item.date,
        revenue: parseFloat(item.revenue),
        orders: item.orders,
      })),
      byPackage: byPackage.map((item) => ({
        packageId: item.packageId,
        packageName: item.packageId ? packageMap.get(item.packageId) : 'Unknown',
        revenue: item._sum.amount || 0,
        orders: item._count.id,
      })),
      byAttributionType: byAttributionType.map((item) => ({
        type: item.attributionType || 'direct',
        revenue: item._sum.amount || 0,
        orders: item._count.id,
      })),
    };
  }
}
