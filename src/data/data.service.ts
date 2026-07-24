import { Injectable } from '@nestjs/common';
import { Order, Package, Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type OrderWithRelations = Order & {
  buyer: User;
  package: Package;
};

type TraderPositionIdea = {
  instrument: string;
  bias: string;
  setup: string;
  invalidation: string;
  risk: string;
};

type TraderInsightResponse = {
  source: 'anthropic' | 'rules';
  generatedAt: string;
  timezone: string;
  aisheId: string;
  packageName: string;
  licence: string;
  validUntil: string;
  summary: string;
  hourlyFocus: string[];
  positionIdeas: TraderPositionIdea[];
  riskChecks: string[];
  disclaimer: string;
};

@Injectable()
export class DataService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly exportHeaders = [
    'torun',
    'ID',
    'Package',
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
    'licence',
    'Validation until',
    'Name',
    'Email',
    'Lot',
    'Currency',
    'Discount',
    'NPS',
    'NPSE',
    'Recording',
    'RecA',
    'StateA',
    'AISP',
    'BadL',
    'W-Events',
    'Wave',
    'HWSmp',
    'HWDlx',
    'Alcc',
    'LimitSize',
    '',
    '',
    '',
    '',
  ];

  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  private toCsvField(value: unknown): string {
    const raw = value == null ? '' : String(value);
    return `"${raw.replace(/"/g, '""')}"`;
  }

  private toCsvLine(values: unknown[]): string {
    return values.map((value) => this.toCsvField(value)).join(';');
  }

  private normalizeAmount(value: unknown): string {
    if (value == null) return '';
    const asNumber = Number(value);
    if (Number.isNaN(asNumber)) return String(value);
    return Number.isInteger(asNumber) ? String(asNumber) : String(asNumber);
  }

  private extractSelectedOptions(selectedOptions: unknown): Set<string> {
    if (!Array.isArray(selectedOptions)) return new Set<string>();
    return new Set(selectedOptions.map((item) => String(item).toLowerCase()));
  }

  private resolveValidityDates(createdAt: Date, validUntil?: Date | null) {
    const fromDate = new Date(createdAt);
    const toDate = validUntil ? new Date(validUntil) : new Date(createdAt);

    if (!validUntil) {
      toDate.setMonth(toDate.getMonth() + 1);
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const periodDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / dayMs));

    return {
      fromDate,
      toDate,
      period: `${periodDays}d`,
    };
  }

  private buildExportRow(order: OrderWithRelations): unknown[] {
    const selected = this.extractSelectedOptions(order.selectedOptions);
    const invoiceInfo = (order.invoiceInfo ?? {}) as Record<string, unknown>;
    const { fromDate, toDate, period } = this.resolveValidityDates(order.createdAt, order.validUntil);

    const limitSize =
      typeof invoiceInfo.limitSize === 'number' || typeof invoiceInfo.limitSize === 'string'
        ? String(invoiceInfo.limitSize)
        : '';

    const licence = '100';

    return [
      '',
      order.aisheId ?? '',
      order.package?.name ?? '',
      '',
      this.formatDate(fromDate),
      order.status === 'PAID' ? '1' : '0',
      order.status,
      '',
      '',
      period,
      '-',
      this.formatDate(fromDate),
      this.formatDate(toDate),
      licence,
      this.formatDate(toDate),
      order.buyer?.name ?? '',
      order.buyer?.email ?? '',
      this.normalizeAmount(order.amount),
      order.currency,
      '0',
      selected.has('nps') ? '1' : '0',
      selected.has('npse') ? '1' : '0',
      selected.has('recording') ? '1' : '0',
      selected.has('reca') ? '1' : '0',
      selected.has('statea') ? '1' : '0',
      selected.has('aisp') ? '1' : '0',
      selected.has('badl') ? '1' : '0',
      selected.has('wevents') ? '1' : '0',
      selected.has('wave') ? '1' : '0',
      selected.has('hwsmp') ? '1' : '0',
      selected.has('hwdlx') ? '1' : '0',
      selected.has('alcc') ? '1' : '0',
      limitSize,
      '',
      '',
      '',
      '',
    ];
  }

  async generateOrdersCSV(): Promise<string> {
    const orders = await this.prisma.order.findMany({
      include: {
        buyer: true,
        package: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const rows = orders.map((order) => this.buildExportRow(order));

    const csv = [this.toCsvLine(this.exportHeaders), ...rows.map((row) => this.toCsvLine(row))].join('\n');
    return csv;
  }

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

    const row = this.buildExportRow(order as OrderWithRelations);
    const csv = [this.toCsvLine(this.exportHeaders), this.toCsvLine(row)].join('\n');

    return csv;
  }

  private buildRowMap(row: unknown[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (let i = 0; i < this.exportHeaders.length; i += 1) {
      const header = this.exportHeaders[i];
      if (!header) continue;
      map[header] = row[i] == null ? '' : String(row[i]);
    }
    return map;
  }

  private extractFirstJsonObject(input: string): string | null {
    const start = input.indexOf('{');
    const end = input.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    return input.slice(start, end + 1);
  }

  private async requestAnthropicInsight(params: {
    rowMap: Record<string, string>;
    nowHour: number;
  }): Promise<Omit<TraderInsightResponse, 'source' | 'generatedAt' | 'timezone' | 'aisheId' | 'packageName' | 'licence' | 'validUntil'> | null> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022';
    const payload = {
      model,
      max_tokens: 700,
      temperature: 0.2,
      system:
        'You are a cautious trading assistant. Provide educational, risk-aware guidance. Never promise outcomes. Use plain Turkish.',
      messages: [
        {
          role: 'user',
          content:
            `Saat: ${params.nowHour}:00 Europe/Istanbul\n` +
            `Trader CSV satırı: ${JSON.stringify(params.rowMap)}\n\n` +
            'Yalnızca geçerli JSON döndür. Şema:\n' +
            '{"summary":"string","hourlyFocus":["string"],"positionIdeas":[{"instrument":"string","bias":"string","setup":"string","invalidation":"string","risk":"string"}],"riskChecks":["string"],"disclaimer":"string"}\n\n' +
            'Kurallar: \n' +
            '- Tavsiye dili kesinlik içermesin (if/then).\n' +
            '- Maksimum 3 positionIdeas döndür.\n' +
            '- Kısa ve uygulanabilir yaz.'
        },
      ],
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const rawText = data.content?.find((item) => item.type === 'text')?.text?.trim();
    if (!rawText) return null;

    const jsonText = this.extractFirstJsonObject(rawText);
    if (!jsonText) return null;

    try {
      const parsed = JSON.parse(jsonText) as {
        summary?: string;
        hourlyFocus?: string[];
        positionIdeas?: TraderPositionIdea[];
        riskChecks?: string[];
        disclaimer?: string;
      };

      return {
        summary: parsed.summary?.trim() || 'Piyasa koşullarına göre temkinli ilerleyin.',
        hourlyFocus: Array.isArray(parsed.hourlyFocus) ? parsed.hourlyFocus.slice(0, 5) : [],
        positionIdeas: Array.isArray(parsed.positionIdeas) ? parsed.positionIdeas.slice(0, 3) : [],
        riskChecks: Array.isArray(parsed.riskChecks) ? parsed.riskChecks.slice(0, 6) : [],
        disclaimer:
          parsed.disclaimer?.trim() ||
          'Bu içerik eğitim amaçlıdır, yatırım tavsiyesi değildir. Nihai karar ve risk yönetimi kullanıcıya aittir.',
      };
    } catch {
      return null;
    }
  }

  private buildFallbackInsight(params: {
    rowMap: Record<string, string>;
    nowHour: number;
  }): Omit<TraderInsightResponse, 'source' | 'generatedAt' | 'timezone' | 'aisheId' | 'packageName' | 'licence' | 'validUntil'> {
    const isLondonOpen = params.nowHour >= 10 && params.nowHour <= 13;
    const isUsSession = params.nowHour >= 15 && params.nowHour <= 19;
    const sessionHint = isLondonOpen
      ? 'Londra açılışı volatil olabilir; kırılım teyidi olmadan acele girişten kaçının.'
      : isUsSession
        ? 'ABD seansında haber akışına bağlı ani hareketlere karşı stop disiplinini artırın.'
        : 'Likiditenin görece düşük olduğu saatlerde lot ve kaldıraç seviyesini sınırlayın.';

    return {
      summary: `Saat bazlı plan: ${sessionHint}`,
      hourlyFocus: [
        'İlk 15 dakikada yön yerine volatiliteyi gözlemleyin.',
        'Aynı anda en fazla 1-2 senaryoya odaklanın.',
        'Yeni pozisyon öncesi spread ve haber takvimini kontrol edin.',
      ],
      positionIdeas: [
        {
          instrument: 'EURUSD / XAUUSD',
          bias: 'Nötr-Temkinli',
          setup: 'Yalnızca destek/direnç kırılımı mum kapanışı ile teyit edilirse giriş düşünün.',
          invalidation: 'Önceki swing altında/üstünde kapanışta senaryoyu iptal edin.',
          risk: 'Pozisyon başı maksimum %0.5-%1 hesap riski.',
        },
      ],
      riskChecks: [
        'Tek işlemde toplam risk limiti aşıldı mı?',
        'Günlük max kayıp limitiniz tanımlı mı?',
        'Stop-loss seviyeniz emirle birlikte gönderildi mi?',
      ],
      disclaimer:
        'Bu içerik eğitim amaçlıdır, yatırım tavsiyesi değildir. Nihai karar ve risk yönetimi kullanıcıya aittir.',
    };
  }

  async generateTraderInsight(userId: string, requestedAisheId?: string): Promise<TraderInsightResponse | { error: string }> {
    const where: Prisma.OrderWhereInput = requestedAisheId
      ? { buyerId: userId, aisheId: requestedAisheId }
      : { buyerId: userId, status: 'PAID', aisheId: { not: null } };

    const order = (await this.prisma.order.findFirst({
      where,
      include: {
        buyer: true,
        package: true,
      },
      orderBy: { createdAt: 'desc' },
    })) as OrderWithRelations | null;

    if (!order) {
      return { error: 'Trader insight için uygun sipariş bulunamadı.' };
    }

    const row = this.buildExportRow(order as OrderWithRelations);
    const rowMap = this.buildRowMap(row);

    const now = new Date();
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        hour12: false,
        timeZone: 'Europe/Istanbul',
      }).format(now),
    );

    const aiInsight = await this.requestAnthropicInsight({ rowMap, nowHour: hour });
    const insight = aiInsight ?? this.buildFallbackInsight({ rowMap, nowHour: hour });

    return {
      source: aiInsight ? 'anthropic' : 'rules',
      generatedAt: now.toISOString(),
      timezone: 'Europe/Istanbul',
      aisheId: order.aisheId ?? '',
      packageName: order.package?.name ?? '',
      licence: rowMap.licence ?? '',
      validUntil: rowMap['Validation until'] ?? '',
      ...insight,
    };
  }
}
