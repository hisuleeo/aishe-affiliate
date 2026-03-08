import { Module } from '@nestjs/common';
import { PackagesController } from './packages.controller';
import { PackagesRepository } from './packages.repository';
import { PackagesService } from './packages.service';

@Module({
  controllers: [PackagesController],
  providers: [PackagesRepository, PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
