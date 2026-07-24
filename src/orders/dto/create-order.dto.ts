import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceInfoDto {
  @IsOptional()
  @IsString()
  type?: 'corporate' | 'individual';

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  taxOffice?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

// Sipariş oluşturma isteği
export class CreateOrderDto {
  @IsUUID()
  packageId!: string;

  @IsOptional()
  @IsUUID()
  affiliateId?: string;

  @IsOptional()
  @IsString()
  affiliateCode?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsString()
  aisheId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptions?: string[];

  @IsOptional()
  @IsNumber()
  limitSize?: number;

  @IsOptional()
  @IsBoolean()
  needsInvoice?: boolean;

  @IsOptional()
  @IsBoolean()
  useAisheeMoney?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceInfoDto)
  invoiceInfo?: InvoiceInfoDto;
}
