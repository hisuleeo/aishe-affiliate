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

// Paket güncelleme isteği
export class UpdatePackageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

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
