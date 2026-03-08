import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackagesService } from './packages.service';

// Paket endpointleri
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  // Herkes paketleri listeleyebilir
  @Get()
  @Public()
  list() {
    return this.packagesService.list();
  }

  // Paket detayları
  @Get(':id')
  @Public()
  getById(@Param('id') id: string) {
    return this.packagesService.getById(id);
  }

  // Sadece ADMIN paket oluşturabilir
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() payload: CreatePackageDto) {
    return this.packagesService.create(payload);
  }

  // Sadece ADMIN paket güncelleyebilir
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() payload: UpdatePackageDto) {
    return this.packagesService.update(id, payload);
  }

  // Sadece ADMIN paket silebilir
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}
