import { IsOptional, IsString, MaxLength, IsObject } from 'class-validator';

export class CreateSupportRequestDto {
  @IsString()
  @MaxLength(2000)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  lang?: string;

  @IsOptional()
  @IsObject()
  userContext?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
}
