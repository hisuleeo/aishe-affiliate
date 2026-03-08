import { IsArray, IsBoolean, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceInfoDto {
  @IsString()
  companyName!: string;

  @IsString()
  taxNumber!: string;

  @IsString()
  taxOffice!: string;

  @IsString()
  address!: string;
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
  referralCode?: string;

  @IsOptional()
  @IsString()
  aisheId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptions?: string[];

  @IsOptional()
  @IsBoolean()
  needsInvoice?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceInfoDto)
  invoiceInfo?: InvoiceInfoDto;
}
