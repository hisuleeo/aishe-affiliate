import { IsEmail, IsString } from 'class-validator';

// Giriş isteği gövdesi
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
