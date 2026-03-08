import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { ExtensionsService } from './extensions.service';
import { CreateExtensionRequestDto } from './dto/create-extension-request.dto';
import { UpdateExtensionStatusDto } from './dto/update-extension-status.dto';

@Controller('extensions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExtensionsController {
  constructor(private readonly extensionsService: ExtensionsService) {}

  // Kullanıcının kendi extension requestleri
  @Get()
  list(@Req() request: { user: { userId: string } }) {
    return this.extensionsService.listByUser(request.user.userId);
  }

  // Extension request oluştur
  @Post()
  create(@Req() request: { user: { userId: string } }, @Body() payload: CreateExtensionRequestDto) {
    return this.extensionsService.createExtensionRequest(request.user.userId, payload);
  }

  // ADMIN extension status güncelleyebilir (ödeme aldığında PAID yapar)
  @Patch(':id/status')
  @Roles('ADMIN')
  updateStatus(@Param('id') id: string, @Body() payload: UpdateExtensionStatusDto) {
    return this.extensionsService.updateExtensionStatus(id, payload.status);
  }
}
