import { Injectable } from '@nestjs/common';
import { Package, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Paket repository: Prisma sorguları burada toplanır
@Injectable()
export class PackagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PackageCreateInput): Promise<Package> {
    return this.prisma.package.create({ data });
  }

  findById(id: string): Promise<Package | null> {
    return this.prisma.package.findUnique({ where: { id } });
  }

  findMany(): Promise<Package[]> {
    return this.prisma.package.findMany({ orderBy: { createdAt: 'desc' } });
  }

  update(id: string, data: Prisma.PackageUpdateInput): Promise<Package> {
    return this.prisma.package.update({ where: { id }, data });
  }

  delete(id: string): Promise<Package> {
    return this.prisma.package.delete({ where: { id } });
  }
}
