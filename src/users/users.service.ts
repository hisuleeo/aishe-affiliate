import { Injectable } from '@nestjs/common';
import { CommissionStatus, Prisma, User, UserRole, UserRoleType, UserStatus } from '@prisma/client';
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

    const [affiliatePref, referralPref] = await Promise.all([
      this.prisma.systemSetting.findUnique({
        where: { key: `user:${userId}:wantsAffiliateProgram` },
      }),
      this.prisma.systemSetting.findUnique({
        where: { key: `user:${userId}:wantsReferralProgram` },
      }),
    ]);

    return {
      ...user,
      wantsAffiliateProgram: affiliatePref
        ? affiliatePref.value === 'true'
        : user.roles.some((r) => r.role === UserRoleType.AFFILIATE),
      wantsReferralProgram: referralPref ? referralPref.value === 'true' : false,
    };
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

  async updateProfile(
    id: string,
    payload: {
      name?: string;
      username?: string;
      wantsAffiliateProgram?: boolean;
      wantsReferralProgram?: boolean;
    },
  ) {
    await this.getById(id);
    const normalizedUsername = payload.username ? this.normalizeUsername(payload.username) : undefined;
    if (normalizedUsername) {
      const existingUsername = await this.usersRepository.findByUsername(normalizedUsername);
      if (existingUsername && existingUsername.id !== id) {
        throw new AppError('Kullanıcı adı zaten kullanımda.', 409, ErrorCodes.USERNAME_EXISTS);
      }
    }

    await this.usersRepository.update(id, {
      name: payload.name,
      username: normalizedUsername,
    });

    if (typeof payload.wantsAffiliateProgram === 'boolean') {
      await this.prisma.systemSetting.upsert({
        where: { key: `user:${id}:wantsAffiliateProgram` },
        update: {
          value: String(payload.wantsAffiliateProgram),
          type: 'boolean',
          category: 'user-preferences',
        },
        create: {
          key: `user:${id}:wantsAffiliateProgram`,
          value: String(payload.wantsAffiliateProgram),
          type: 'boolean',
          category: 'user-preferences',
        },
      });
    }

    if (typeof payload.wantsReferralProgram === 'boolean') {
      await this.prisma.systemSetting.upsert({
        where: { key: `user:${id}:wantsReferralProgram` },
        update: {
          value: String(payload.wantsReferralProgram),
          type: 'boolean',
          category: 'user-preferences',
        },
        create: {
          key: `user:${id}:wantsReferralProgram`,
          value: String(payload.wantsReferralProgram),
          type: 'boolean',
          category: 'user-preferences',
        },
      });
    }

    // Sync referral code and affiliate links when username changes
    if (normalizedUsername) {
      // Update referral code to match new username
      const referralCode = await this.prisma.referralCode.findFirst({ where: { userId: id } });
      if (referralCode) {
        const codeConflict = await this.prisma.referralCode.findUnique({ where: { code: normalizedUsername } });
        if (!codeConflict || codeConflict.userId === id) {
          await this.prisma.referralCode.update({
            where: { id: referralCode.id },
            data: { code: normalizedUsername },
          });
        }
      }

      // Update affiliate link targetUrl (and code if available) to match new username
      const affiliateLinks = await this.prisma.affiliateLink.findMany({
        where: { affiliateId: id },
        orderBy: { createdAt: 'asc' },
      });
      for (let i = 0; i < affiliateLinks.length; i++) {
        const link = affiliateLinks[i];
        const newCode = i === 0 ? normalizedUsername : `${normalizedUsername}_${i + 1}`;
        const codeConflict = await this.prisma.affiliateLink.findUnique({ where: { code: newCode } });
        if (!codeConflict || codeConflict.affiliateId === id) {
          await this.prisma.affiliateLink.update({
            where: { id: link.id },
            data: {
              code: newCode,
              targetUrl: `https://app.aishe.pro/ref/${normalizedUsername}`,
            },
          });
        } else {
          // Just update the targetUrl even if code can't change
          await this.prisma.affiliateLink.update({
            where: { id: link.id },
            data: { targetUrl: `https://app.aishe.pro/ref/${normalizedUsername}` },
          });
        }
      }
    }

    return this.getProfile(id);
  }

  async remove(id: string): Promise<User> {
    await this.getById(id);
    return this.usersRepository.delete(id);
  }

  async getOrCreateReferralCode(userId: string) {
    const user = await this.usersRepository.findById(userId);
    const existing = await this.prisma.referralCode.findFirst({ where: { userId } });
    if (existing) {
      if (user?.username && existing.code !== user.username) {
        const taken = await this.prisma.referralCode.findUnique({ where: { code: user.username } });
        if (!taken || taken.userId === userId) {
          return this.prisma.referralCode.update({
            where: { id: existing.id },
            data: { code: user.username },
          });
        }
      }
      return existing;
    }

    // Use username as referral code (falls back only if username is missing)
    let code: string;
    if (user?.username) {
      const taken = await this.prisma.referralCode.findUnique({ where: { code: user.username } });
      code = taken ? await this.generateReferralCode() : user.username;
    } else {
      code = await this.generateReferralCode();
    }

    return this.prisma.referralCode.create({
      data: {
        user: { connect: { id: userId } },
        code,
      },
    });
  }

  async getReferralStats(userId: string) {
    // Kullanıcının referral code'unu bul
    const referralCode = await this.prisma.referralCode.findFirst({
      where: { userId },
    });

    if (!referralCode) {
      return {
        totalInvites: 0,
        successfulInvites: 0,
        totalRewards: '0.00',
        currency: 'EUR',
      };
    }

    // Bu code ile oluşturulan inviteleri bul
    const invites = await this.prisma.referralInvite.findMany({
      where: { codeId: referralCode.id },
      include: {
        signups: true,
      },
    });

    const totalInvites = invites.reduce((sum, inv) => sum + inv.signups.length, 0);

    // Başarılı davetler (signup yapmış kişiler)
    const successfulInvites = totalInvites;

    // Toplam ödüller (ReferralReward tablosundan)
    const rewards = await this.prisma.referralReward.findMany({
      where: { referralUserId: userId },
    });

    const totalRewards = rewards.reduce(
      (sum, reward) => sum + Number(reward.amount),
      0,
    );

    return {
      totalInvites,
      successfulInvites,
      totalRewards: totalRewards.toFixed(2),
      currency: rewards[0]?.currency ?? 'EUR',
    };
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
    const targetUrl = `https://app.aishe.pro/ref/${username}`;

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
      const suffix = attempt === 0 ? '' : `_${Math.random().toString(36).substring(2, 6)}`;
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

  async getAffiliateStats(userId: string) {
    // Commission'ları Conversion üzerinden çek
    const [commissions, clicks] = await Promise.all([
      this.prisma.commission.findMany({
        where: { affiliateId: userId },
        include: { 
          conversion: {
            include: {
              order: {
                include: {
                  package: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.click.count({
        where: { 
          affiliateLink: {
            affiliateId: userId,
          },
        },
      }),
    ]);

    const totalConversions = commissions.length;
    const totalEarnings = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
    const pendingEarnings = commissions
      .filter(c => c.status === CommissionStatus.PENDING)
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const paidEarnings = commissions
      .filter(c => c.status === CommissionStatus.PAID)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const conversionRate = clicks > 0 ? (totalConversions / clicks) * 100 : 0;

    return {
      totalClicks: clicks,
      totalConversions,
      totalEarnings: totalEarnings.toFixed(2),
      pendingEarnings: pendingEarnings.toFixed(2),
      paidEarnings: paidEarnings.toFixed(2),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      currency: 'EUR',
    };
  }

  async getAffiliateCommissions(userId: string) {
    const commissions = await this.prisma.commission.findMany({
      where: { affiliateId: userId },
      include: {
        conversion: {
          include: {
            order: {
              include: {
                package: true,
              },
            },
          },
        },
      },
      orderBy: { conversion: { conversionAt: 'desc' } },
    });

    return commissions;
  }

  async getReferralRewards(userId: string) {
    const rewards = await this.prisma.referralReward.findMany({
      where: { referralUserId: userId },
      include: {
        signup: {
          include: {
            newUser: true,
          },
        },
        order: {
          include: {
            package: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rewards;
  }
}
