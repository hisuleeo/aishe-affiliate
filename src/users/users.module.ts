import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersMeController } from './users.me.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  controllers: [UsersController, UsersMeController],
  providers: [UsersRepository, UsersService, RolesGuard],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
