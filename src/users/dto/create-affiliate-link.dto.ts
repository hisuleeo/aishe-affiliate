import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateAffiliateLinkDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true, require_tld: false })
  targetUrl!: string;
}
