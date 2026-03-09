import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register endpoint
  @Post('register')
  @Public()
  register(@Body() payload: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(payload);
  }

  // Login endpoint
  @Post('login')
  @Public()
  login(@Body() payload: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(payload);
  }

  // Google OAuth - Redirect to Google
  @Get('google')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  googleAuth() {
    // Guard otomatik olarak Google'a yönlendirir
  }

  // Google OAuth - Callback
  @Get('google/callback')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as { googleId: string; email: string; name: string; avatar?: string };
    const token = await this.authService.googleLogin(googleUser);

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://app.aishe.pro';
    res.redirect(`${frontendUrl}/auth/google/callback?token=${token.accessToken}`);
  }
}
