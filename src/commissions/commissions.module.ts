import { Module } from '@nestjs/common';
import { CommissionListener } from './commissions.listener';
import { CommissionsService } from './commissions.service';

@Module({
  providers: [CommissionsService, CommissionListener],
})
export class CommissionsModule {}
