import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgramsController],
})
export class ProgramsModule {}
