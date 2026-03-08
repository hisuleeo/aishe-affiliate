import { Injectable } from '@nestjs/common';
import { Package, Prisma } from '@prisma/client';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackagesRepository } from './packages.repository';

// Paket iş mantığı
@Injectable()
export class PackagesService {
  constructor(private readonly packagesRepository: PackagesRepository) {}

  list(): Promise<Package[]> {
    return this.packagesRepository.findMany();
  }

  async getById(id: string): Promise<Package> {
    const pkg = await this.packagesRepository.findById(id);
    if (!pkg) {
      throw new AppError('Paket bulunamadı.', 404, ErrorCodes.PACKAGE_NOT_FOUND);
    }
    return pkg;
  }

  create(payload: CreatePackageDto): Promise<Package> {
    return this.packagesRepository.create({
      name: payload.name,
      description: payload.description,
      price: payload.price,
      currency: payload.currency,
      commissionRate: payload.commissionRate,
      isCustom: payload.isCustom ?? false,
  customOptions: (payload.customOptions ?? []) as unknown as Prisma.InputJsonValue,
      isActive: payload.isActive ?? true,
    });
  }

  async update(id: string, payload: UpdatePackageDto): Promise<Package> {
    await this.getById(id);
    return this.packagesRepository.update(id, {
      name: payload.name,
      description: payload.description,
      price: payload.price,
      currency: payload.currency,
      commissionRate: payload.commissionRate,
      isCustom: payload.isCustom,
  customOptions: payload.customOptions as unknown as Prisma.InputJsonValue,
      isActive: payload.isActive,
    });
  }

  async remove(id: string): Promise<Package> {
    await this.getById(id);
    return this.packagesRepository.delete(id);
  }
}
