import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

// Sipariş yönetimi endpointleri
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Kullanıcının kendi siparişleri
  @Get()
  list(@Req() request: { user: { userId: string } }) {
    return this.ordersService.listByBuyer(request.user.userId);
  }

  // Paket satın alma
  @Post()
  create(@Req() request: { user: { userId: string } }, @Body() payload: CreateOrderDto) {
    return this.ordersService.createOrder(request.user.userId, payload);
  }

  // ADMIN statü güncelleyebilir
  @Patch(':id/status')
  @Roles('ADMIN')
  updateStatus(@Param('id') id: string, @Body() payload: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, payload.status);
  }
}
