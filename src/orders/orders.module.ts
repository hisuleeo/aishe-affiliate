import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { PackagesModule } from '../packages/packages.module';
import { ActionLogsModule } from '../action-logs/action-logs.module';

@Module({
  imports: [PackagesModule, ActionLogsModule],
  controllers: [OrdersController],
  providers: [OrdersRepository, OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
