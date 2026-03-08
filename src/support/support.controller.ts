import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddReplyDto } from './dto/add-reply.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // Public chatbot endpoint
  @Public()
  @Post('chat')
  createSupportRequest(@Body() payload: CreateSupportRequestDto) {
    return this.supportService.getChatResponse(payload.question, payload.lang);
  }

  // Create ticket - Authenticated users
  @UseGuards(JwtAuthGuard)
  @Post('tickets')
  createTicket(@CurrentUser() user: JwtPayload, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(user.sub, dto);
  }

  // Get user's tickets
  @UseGuards(JwtAuthGuard)
  @Get('tickets/my')
  getUserTickets(@CurrentUser() user: JwtPayload) {
    return this.supportService.getUserTickets(user.sub);
  }

  // Get specific ticket
  @UseGuards(JwtAuthGuard)
  @Get('tickets/:id')
  getTicket(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const isAdmin = user.roles.includes('ADMIN');
    return this.supportService.getTicketById(id, isAdmin ? undefined : user.sub);
  }

  // Add reply to ticket
  @UseGuards(JwtAuthGuard)
  @Post('tickets/:id/replies')
  addReply(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddReplyDto,
  ) {
    const isStaff = user.roles.includes('ADMIN');
    return this.supportService.addReply(id, user.sub, dto, isStaff);
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/tickets')
  getAllTickets() {
    return this.supportService.getAllTickets();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/tickets/:id/status')
  updateTicketStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.supportService.updateTicketStatus(id, dto.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/tickets/:id')
  deleteTicket(@Param('id') id: string) {
    return this.supportService.deleteTicket(id);
  }
}
