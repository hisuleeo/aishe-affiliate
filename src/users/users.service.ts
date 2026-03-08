import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole, UserRoleType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  private mapRoleUpdate(role?: UserRoleType): Prisma.UserUpdateInput | undefined {
    if (!role) return undefined;
    return {
      roles: {
        deleteMany: {},
        create: [{ role }],
      },
    };
  }

  async list(): Promise<User[]> {
    return this.usersRepository.findMany();
  }

  private sanitizeUser(user: User & { roles: UserRole[] }) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async getById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('Kullanıcı bulunamadı.', 404, ErrorCodes.USER_NOT_FOUND);
    }
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
        createdAt: true,
        roles: true,
      },
    });

    if (!user) {
      throw new AppError('Kullanıcı bulunamadı.', 404, ErrorCodes.USER_NOT_FOUND);
    }

    return user;
  }

  async create(payload: CreateUserDto): Promise<User> {
    const normalizedUsername = this.normalizeUsername(payload.username);
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

    const passwordHash = await bcrypt.hash(payload.password, 12);

    return this.usersRepository.create({
      email: payload.email,
      username: normalizedUsername,
      name: payload.name,
      passwordHash,
      status: UserStatus.ACTIVE,
      roles: { create: [{ role: UserRoleType.USER }] },
    });
  }

  async update(id: string, payload: UpdateUserDto): Promise<User> {
    await this.getById(id);
    const normalizedUsername = payload.username ? this.normalizeUsername(payload.username) : undefined;
    if (normalizedUsername) {
      const existingUsername = await this.usersRepository.findByUsername(normalizedUsername);
      if (existingUsername && existingUsername.id !== id) {
        throw new AppError('Kullanıcı adı zaten kullanımda.', 409, ErrorCodes.USERNAME_EXISTS);
      }
    }
    return this.usersRepository.update(id, {
      name: payload.name,
      username: normalizedUsername,
      status: payload.status,
      ...this.mapRoleUpdate(payload.role),
    });
  }

  async updateProfile(id: string, payload: { name?: string; username?: string }) {
    await this.getById(id);
    const normalizedUsername = payload.username ? this.normalizeUsername(payload.username) : undefined;
    if (normalizedUsername) {
      const existingUsername = await this.usersRepository.findByUsername(normalizedUsername);
      if (existingUsername && existingUsername.id !== id) {
        throw new AppError('Kullanıcı adı zaten kullanımda.', 409, ErrorCodes.USERNAME_EXISTS);
      }
    }

    const updated = await this.usersRepository.update(id, {
      name: payload.name,
      username: normalizedUsername,
    });

    return this.sanitizeUser(updated as User & { roles: UserRole[] });
  }

  async remove(id: string): Promise<User> {
    await this.getById(id);
    return this.usersRepository.delete(id);
  }

  async getOrCreateReferralCode(userId: string) {
    const existing = await this.prisma.referralCode.findFirst({ where: { userId } });
    if (existing) {
      return existing;
    }

    const code = await this.generateReferralCode();
    return this.prisma.referralCode.create({
      data: {
        user: { connect: { id: userId } },
        code,
      },
    });
  }

  listAffiliateLinks(userId: string) {
    return this.prisma.affiliateLink.findMany({
      where: { affiliateId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAffiliateLinkMetrics(userId: string, linkId: string) {
    const link = await this.prisma.affiliateLink.findFirst({
      where: { id: linkId, affiliateId: userId },
    });

    if (!link) {
      throw new AppError('Affiliate link bulunamadı.', 404, ErrorCodes.USER_NOT_FOUND);
    }

    const [
      totalClicks,
      uniqueCookieGroups,
      lastClickedAt,
      topSources,
      topMediums,
      topCampaigns,
    ] = await Promise.all([
      this.prisma.click.count({ where: { affiliateLinkId: linkId } }),
      this.prisma.click.groupBy({
        by: ['cookieId'],
        where: { affiliateLinkId: linkId },
      }),
      this.prisma.click.aggregate({
        where: { affiliateLinkId: linkId },
        _max: { clickedAt: true },
      }),
      this.prisma.click.groupBy({
        by: ['utmSource'],
        where: { affiliateLinkId: linkId, utmSource: { not: null } },
        _count: { utmSource: true },
        orderBy: { _count: { utmSource: 'desc' } },
        take: 5,
      }),
      this.prisma.click.groupBy({
        by: ['utmMedium'],
        where: { affiliateLinkId: linkId, utmMedium: { not: null } },
        _count: { utmMedium: true },
        orderBy: { _count: { utmMedium: 'desc' } },
        take: 5,
      }),
      this.prisma.click.groupBy({
        by: ['utmCampaign'],
        where: { affiliateLinkId: linkId, utmCampaign: { not: null } },
        _count: { utmCampaign: true },
        orderBy: { _count: { utmCampaign: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      link,
      totals: {
        totalClicks,
        uniqueCookies: uniqueCookieGroups.length,
        lastClickedAt: lastClickedAt._max.clickedAt ?? null,
      },
      utm: {
        sources: topSources.map((item) => ({
          value: item.utmSource,
          count: item._count?.utmSource ?? 0,
        })),
        mediums: topMediums.map((item) => ({
          value: item.utmMedium,
          count: item._count?.utmMedium ?? 0,
        })),
        campaigns: topCampaigns.map((item) => ({
          value: item.utmCampaign,
          count: item._count?.utmCampaign ?? 0,
        })),
      },
    };
  }

  async createAffiliateLink(userId: string, payload: { targetUrl: string }) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new AppError('Kullanıcı bulunamadı.', 404, ErrorCodes.USER_NOT_FOUND);
    }
    const username = await this.ensureUsername(user);
    const targetUrl = payload.targetUrl.trim();
    if (!targetUrl) {
      throw new AppError('Hedef URL boş olamaz.', 400, ErrorCodes.INTERNAL_ERROR);
    }

    const program = await this.prisma.program.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    if (!program) {
      throw new AppError('Aktif program bulunamadı.', 400, ErrorCodes.INTERNAL_ERROR);
    }

  const code = await this.generateAffiliateCode(username);
    return this.prisma.affiliateLink.create({
      data: {
        affiliate: { connect: { id: userId } },
        program: { connect: { id: program.id } },
        code,
        targetUrl,
      },
    });
  }

  private async generateReferralCode(): Promise<string> {
    const prefix = 'AISHE';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const code = `${prefix}-${suffix}`;
      const exists = await this.prisma.referralCode.findUnique({ where: { code } });
      if (!exists) {
        return code;
      }
    }

    throw new AppError('Referral kodu üretilemedi.', 500, ErrorCodes.INTERNAL_ERROR);
  }

  private async generateAffiliateCode(username: string): Promise<string> {
    const base = username.toLowerCase();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = attempt === 0 ? '' : `-${Math.random().toString(36).substring(2, 6)}`;
      const code = `${base}${suffix}`;
      const exists = await this.prisma.affiliateLink.findUnique({ where: { code } });
      if (!exists) {
        return code;
      }
    }

    throw new AppError('Affiliate link oluşturulamadı.', 500, ErrorCodes.INTERNAL_ERROR);
  }

  private normalizeUsername(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24);
  }

  private async ensureUsername(user: User): Promise<string> {
    if (user.username) {
      return user.username;
    }

    const emailPrefix = user.email.split('@')[0] ?? 'user';
    const base = this.normalizeUsername(emailPrefix) || 'user';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = attempt === 0 ? '' : `${Math.floor(100 + Math.random() * 900)}`;
      const candidate = `${base}${suffix ? `_${suffix}` : ''}`;
      const exists = await this.usersRepository.findByUsername(candidate);
      if (!exists) {
        const updated = await this.usersRepository.update(user.id, { username: candidate });
        return updated.username ?? candidate;
      }
    }

    throw new AppError('Kullanıcı adı üretilemedi.', 500, ErrorCodes.INTERNAL_ERROR);
  }
}
