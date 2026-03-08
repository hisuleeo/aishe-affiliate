import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { PackagesModule } from './packages/packages.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommissionsModule } from './commissions/commissions.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SupportModule } from './support/support.module';
import { DataModule } from './data/data.module';
import { ExtensionsModule } from './extensions/extensions.module';
import { ProgramsModule } from './programs/programs.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    PackagesModule,
    OrdersModule,
    CommissionsModule,
    AdminModule,
    SupportModule,
    DataModule,
    ExtensionsModule,
    ProgramsModule,
    SystemModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
