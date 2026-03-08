import { IsUUID } from 'class-validator';

export class CreateExtensionRequestDto {
  @IsUUID()
  orderId!: string;
}
