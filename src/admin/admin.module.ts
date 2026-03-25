import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { AdminController } from './admin.controller';
import { ActionLogsModule } from '../action-logs/action-logs.module';
import { ActionLogsController } from '../action-logs/action-logs.controller';

@Module({
  imports: [UsersModule, OrdersModule, ActionLogsModule],
  controllers: [AdminController, ActionLogsController],
})
export class AdminModule {}
