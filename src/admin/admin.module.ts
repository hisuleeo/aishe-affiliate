import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [UsersModule, OrdersModule],
  controllers: [AdminController],
})
export class AdminModule {}
