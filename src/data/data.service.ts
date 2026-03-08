import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DataService {
  constructor(private readonly prisma: PrismaService) {}

  async generateCSV(aisheId: string): Promise<string | null> {
    // aisheId ile siparişi bul
    const order = await this.prisma.order.findFirst({
      where: { aisheId },
      include: {
        buyer: true,
        package: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      return null;
    }

    // Seçilen özellikleri al
    const selectedOptions = (order.selectedOptions as string[]) || [];
    
    // Package options'ı parse et
    const packageOptions = order.package.customOptions as any[];
    const optionIds = packageOptions?.map((opt) => opt.id) || [];

    // CSV başlıkları
    const headers = [
      'torun',
      'ID',
      'Nic',
      'Start',
      'Activ',
      'Status',
      'Internal Note',
      '',
      'Period',
      'M-Payment',
      'from',
      'to',
      '',
      'Validation until',
      'Email',
      'Lot',
      'NPS',
      'NPSE',
      'Recording',
      'RecA',
      'StateA',
      'AISP',
      'BadL',
      'W-Events',
      'Wave',
      '',
      '',
      '',
      '',
    ];

    // Tarih formatı: DD.MM.YYYY
    const formatDate = (date: Date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    };

    const startDate = formatDate(order.createdAt);
    const endDate = new Date(order.createdAt);
    endDate.setMonth(endDate.getMonth() + 1);
    const validationDate = formatDate(endDate);

    // Veri satırı
    const dataRow = [
      '',                                     // torun
      aisheId,                               // ID
      '',                                     // Nic
      startDate,                             // Start
      '1',                                    // Activ
      '',                                     // Status
      '1234',                                // Internal Note
      '',                                     // empty
      '-',                                    // Period
      '-',                                    // M-Payment
      startDate,                             // from
      formatDate(endDate),                   // to
      '',                                     // empty
      validationDate,                        // Validation until
      order.buyer.email,                     // Email
      String(order.amount),                  // Lot (price)
      selectedOptions.includes('nps') ? '1' : '0',
      selectedOptions.includes('npse') ? '1' : '0',
      selectedOptions.includes('recording') ? '1' : '0',
      selectedOptions.includes('reca') ? '1' : '0',
      selectedOptions.includes('statea') ? '1' : '0',
      selectedOptions.includes('aisp') ? '1' : '0',
      selectedOptions.includes('badl') ? '1' : '0',
      selectedOptions.includes('wevents') ? '1' : '0',
      selectedOptions.includes('wave') ? '1' : '0',
      '',
      '',
      '',
      '',
    ];

    // CSV formatı
    const csv = [
      headers.join(';'),
      dataRow.join(';'),
    ].join('\n');

    return csv;
  }
}
