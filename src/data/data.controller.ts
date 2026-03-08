import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DataService } from './data.service';
import { Public } from '../decorators/public.decorator';

@Controller('api/v1/data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Public()
  @Get('file')
  async getDataFile(@Query('id') id: string, @Res() res: Response) {
    if (!id) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'ID parameter is required' });
    }

    const csvData = await this.dataService.generateCSV(id);
    
    if (!csvData) {
      return res.status(HttpStatus.NOT_FOUND).json({ error: 'Order not found' });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${id}_record.csv"`);
    return res.send(csvData);
  }
}
