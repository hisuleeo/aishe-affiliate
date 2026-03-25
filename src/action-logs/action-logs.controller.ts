import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActionLogsService } from './action-logs.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';

@Controller('admin/action-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleType.ADMIN)
export class ActionLogsController {
  constructor(private actionLogsService: ActionLogsService) {}

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.actionLogsService.findAll({
      userId,
      action,
      entityType,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
