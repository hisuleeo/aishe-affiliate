import { IsEnum } from 'class-validator';
import { ExtensionRequestStatus } from '@prisma/client';

export class UpdateExtensionStatusDto {
  @IsEnum(ExtensionRequestStatus)
  status!: ExtensionRequestStatus;
}
