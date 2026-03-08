import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PackageOptionDto {
  @IsString()
  id!: string;

  @IsString()
  label!: string;

  @IsNumber()
  price!: number;
}

// Paket oluşturma isteği
export class CreatePackageDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price!: number;

  @IsString()
  currency!: string;

  @IsNumber()
  commissionRate!: number;

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageOptionDto)
  customOptions?: PackageOptionDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
