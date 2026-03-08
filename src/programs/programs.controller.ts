import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  attributionWindowDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  cookieTtlDays?: number;

  @IsString()
  @MaxLength(3)
  defaultCurrency!: string;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  attributionWindowDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  cookieTtlDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  defaultCurrency?: string;
}

export class CreateCampaignDto {
  @IsString()
  programId!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}

@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
  constructor(private readonly prisma: PrismaService) {}

  // Program Management
  @Get()
  @Roles('ADMIN')
  async listPrograms() {
    const programs = await this.prisma.program.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            campaigns: true,
            affiliateLinks: true,
            conversions: true,
          },
        },
      },
    });
    return programs;
  }

  @Get(':id')
  @Roles('ADMIN')
  async getProgram(@Param('id') id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        campaigns: {
          orderBy: { name: 'asc' },
        },
        commissionTiers: {
          orderBy: { minSalesThreshold: 'asc' },
        },
        _count: {
          select: {
            affiliateLinks: true,
            conversions: true,
          },
        },
      },
    });

    if (!program) {
      throw new AppError('Program bulunamadı.', 404, ErrorCodes.INTERNAL_ERROR);
    }

    return program;
  }

  @Post()
  @Roles('ADMIN')
  async createProgram(@Body() dto: CreateProgramDto) {
    const program = await this.prisma.program.create({
      data: {
        name: dto.name,
        status: dto.status ?? 'active',
        attributionWindowDays: dto.attributionWindowDays ?? 30,
        cookieTtlDays: dto.cookieTtlDays ?? 30,
        defaultCurrency: dto.defaultCurrency,
      },
    });

    return program;
  }

  @Patch(':id')
  @Roles('ADMIN')
  async updateProgram(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    const existing = await this.prisma.program.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Program bulunamadı.', 404, ErrorCodes.INTERNAL_ERROR);
    }

    const updated = await this.prisma.program.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status,
        attributionWindowDays: dto.attributionWindowDays,
        cookieTtlDays: dto.cookieTtlDays,
        defaultCurrency: dto.defaultCurrency,
      },
    });

    return updated;
  }

  @Delete(':id')
  @Roles('ADMIN')
  async deleteProgram(@Param('id') id: string) {
    const existing = await this.prisma.program.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Program bulunamadı.', 404, ErrorCodes.INTERNAL_ERROR);
    }

    await this.prisma.program.delete({ where: { id } });
    return { success: true };
  }

  // Campaign Management
  @Get(':programId/campaigns')
  @Roles('ADMIN')
  async listCampaigns(@Param('programId') programId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { programId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            affiliateLinks: true,
          },
        },
      },
    });
    return campaigns;
  }

  @Post('campaigns')
  @Roles('ADMIN')
  async createCampaign(@Body() dto: CreateCampaignDto) {
    const program = await this.prisma.program.findUnique({
      where: { id: dto.programId },
    });
    if (!program) {
      throw new AppError('Program bulunamadı.', 404, ErrorCodes.INTERNAL_ERROR);
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        programId: dto.programId,
        name: dto.name,
        status: dto.status ?? 'active',
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });

    return campaign;
  }

  @Patch('campaigns/:id')
  @Roles('ADMIN')
  async updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Campaign bulunamadı.', 404, ErrorCodes.INTERNAL_ERROR);
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });

    return updated;
  }

  @Delete('campaigns/:id')
  @Roles('ADMIN')
  async deleteCampaign(@Param('id') id: string) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Campaign bulunamadı.', 404, ErrorCodes.INTERNAL_ERROR);
    }

    await this.prisma.campaign.delete({ where: { id } });
    return { success: true };
  }
}
