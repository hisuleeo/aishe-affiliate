import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRoleType, UserStatus } from '@prisma/client';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

const TOKEN_EXPIRES_IN = 60 * 60; // 1 saat

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // Kullanıcı doğrulama (login içindeki temel kontrol)
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Kullanıcı bulunamadı.', 404, ErrorCodes.USER_NOT_FOUND);
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError('E-posta veya şifre hatalı.', 401, ErrorCodes.USER_INVALID_CREDENTIALS);
    }

    return user;
  }

  // Kayıt (Register)
  async register(payload: RegisterDto) {
    const normalizedUsername = payload.username.trim().toLowerCase();
    const [existing, existingUsername] = await Promise.all([
      this.usersRepository.findByEmail(payload.email),
      this.usersRepository.findByUsername(normalizedUsername),
    ]);
    if (existing) {
      throw new AppError('E-posta zaten kullanımda.', 409, ErrorCodes.USER_EMAIL_EXISTS);
    }
    if (existingUsername) {
      throw new AppError('Kullanıcı adı zaten kullanımda.', 409, ErrorCodes.USERNAME_EXISTS);
    }

    // Referral code kontrolü (opsiyonel)
    let referralUserId: string | undefined;
    if (payload.referralCode && payload.referralCode.trim()) {
      const referralUser = await this.usersRepository.findByUsername(payload.referralCode.trim().toLowerCase());
      if (referralUser) {
        referralUserId = referralUser.id;
      }
      // Referral code geçersizse hata vermiyoruz, sadece ignore ediyoruz
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const user = await this.usersRepository.create({
      email: payload.email,
      username: normalizedUsername,
      name: payload.name,
      passwordHash,
      status: UserStatus.ACTIVE,
      roles: { create: [{ role: UserRoleType.USER }] },
    });

    // Yeni kullanıcıya kendi referral code'unu oluştur
    await this.prisma.referralCode.create({
      data: {
        userId: user.id,
        code: normalizedUsername,
      },
    });

    // Referral signup kaydı oluştur (eğer referral code geçerliyse)
    if (referralUserId) {
      // Referral user'ın code'unu bul
      const referralCode = await this.prisma.referralCode.findFirst({
        where: { userId: referralUserId },
      });

      if (referralCode) {
        // ReferralInvite oluştur
        const invite = await this.prisma.referralInvite.create({
          data: {
            codeId: referralCode.id,
            target: payload.email,
            channel: 'web_registration',
          },
        });

        // ReferralSignup oluştur
        await this.prisma.referralSignup.create({
          data: {
            inviteId: invite.id,
            newUserId: user.id,
          },
        });
      }
    }

    return this.issueToken(user);
  }

  // Giriş (Login)
  async login(payload: LoginDto) {
    const user = await this.validateUser(payload.email, payload.password);
    return this.issueToken(user);
  }

  // Token üretimi
  issueToken(user: User & { roles?: { role: UserRoleType }[] }) {
    const roles = user.roles?.map((role) => role.role) ?? [];
    const payload = { sub: user.id, email: user.email, roles };

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer' as const,
      expiresIn: TOKEN_EXPIRES_IN,
    };
  }

  // Google OAuth ile giriş/kayıt
  async googleLogin(googleUser: { googleId: string; email: string; name: string; avatar?: string }) {
    if (!googleUser.email) {
      throw new AppError('Google hesabında e-posta bulunamadı.', 400, ErrorCodes.USER_INVALID_CREDENTIALS);
    }

    // Kullanıcıyı email ile bul
    let user = await this.usersRepository.findByEmail(googleUser.email);

    if (!user) {
      // Yeni kullanıcı oluştur
      const username = googleUser.email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase()
        + '_' + crypto.randomBytes(3).toString('hex');
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await this.usersRepository.create({
        email: googleUser.email,
        username,
        name: googleUser.name || undefined,
        passwordHash,
        status: UserStatus.ACTIVE,
        roles: { create: [{ role: UserRoleType.USER }] },
      });

      // Yeni kullanıcıya kendi referral code'unu oluştur
      await this.prisma.referralCode.create({
        data: {
          userId: user.id,
          code: username,
        },
      });
    }

    return this.issueToken(user);
  }
}
