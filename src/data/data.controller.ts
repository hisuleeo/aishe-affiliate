import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DataService } from './data.service';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('api/v1/data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Public()
  @Get('file')
  async getDataFile(@Query('id') id: string, @Res() res: Response) {
    if (!id) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(HttpStatus.OK).send('');
    }

    const csvData = await this.dataService.generateCSV(id);
    
    if (!csvData) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(HttpStatus.OK).send('');
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.csv"`);
    return res.send(csvData);
  }

  @Public()
  @Get('find')
  async getDataFind(@Query('id') id: string, @Res() res: Response) {
    return this.getDataFile(id, res);
  }

  @Public()
  @Get('export')
  async exportOrders(@Query('key') key: string, @Res() res: Response) {
    const expectedKey = process.env.DATA_EXPORT_KEY;

    if (!expectedKey || !key || key !== expectedKey) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(HttpStatus.OK).send('');
    }

    const csvData = await this.dataService.generateOrdersCSV();
    const today = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="aishe_orders_${today}.csv"`);
    return res.send(csvData);
  }

  @Get('trader-insight')
  async getTraderInsight(
    @CurrentUser() user: { userId: string },
    @Query('id') id?: string,
  ) {
    return this.dataService.generateTraderInsight(user.userId, id);
  }
}
