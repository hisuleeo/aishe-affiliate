import { Body, Controller, Get, Post, Req, Res, UseGuards, Ip, Headers } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { Request, Response } from 'express';
import { ActionLogsService } from '../action-logs/action-logs.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly actionLogsService: ActionLogsService,
  ) {}

  // Register endpoint
  @Post('register')
  @Public()
  async register(
    @Body() payload: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(payload);
    
    // Extract userId from token (simple decode)
    try {
      const tokenPayload = JSON.parse(Buffer.from(result.accessToken.split('.')[1], 'base64').toString());
      
      await this.actionLogsService.log({
        userId: tokenPayload.sub,
        action: 'user.registered',
        entityType: 'User',
        entityId: tokenPayload.sub,
        metadata: {
          email: payload.email,
          username: payload.username,
          referralCode: payload.referralCode,
        },
        ipAddress,
        userAgent,
      });
    } catch (err) {
      // Log hatası ana işlemi engellemez
      console.error('Action log error:', err);
    }
    
    return result;
  }

  // Login endpoint
  @Post('login')
  @Public()
  async login(
    @Body() payload: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(payload);
    
    // Extract userId from token
    try {
      const tokenPayload = JSON.parse(Buffer.from(result.accessToken.split('.')[1], 'base64').toString());
      
      await this.actionLogsService.log({
        userId: tokenPayload.sub,
        action: 'user.logged_in',
        entityType: 'User',
        entityId: tokenPayload.sub,
        metadata: { email: payload.email },
        ipAddress,
        userAgent,
      });
    } catch (err) {
      // Log hatası ana işlemi engellemez
      console.error('Action log error:', err);
    }
    
    return result;
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
