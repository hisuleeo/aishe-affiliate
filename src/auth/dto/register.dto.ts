import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// Kayıt işlemi için gerekli alanları taşır
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(24)
  @Matches(/^[a-z0-9_]+$/i, {
    message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.',
  })
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
