import { Injectable } from '@nestjs/common';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddReplyDto } from './dto/add-reply.dto';

const DEFAULT_LANG = 'tr';

// AISHE Knowledge Base
const AISHE_KNOWLEDGE = `
# AISHE Platform Bilgisi

## Platform Özeti
AISHE, yapay zeka destekli veri analizi ve iş zekası çözümleri sunan modern bir SaaS platformudur. Kullanıcılar AISHE ile verilerini analiz edebilir, öngörüler elde edebilir ve iş süreçlerini optimize edebilir.

## Ana Özellikler

### 1. Veri Analizi
- **Gerçek Zamanlı Analiz**: Verilerinizi anlık olarak analiz edin
- **Özel Raporlar**: İhtiyacınıza özel raporlar oluşturun
- **Görselleştirme**: Grafikler ve dashboard'lar ile verilerinizi görselleştirin
- **CSV/Excel Desteği**: Dosyalarınızı kolayca içe aktarın

### 2. Yapay Zeka Özellikleri
- **Akıllı Öngörüler**: AI destekli tahminler ve öneriler
- **Otomatik Raporlama**: Düzenli otomatik raporlar
- **Anomali Tespiti**: Verilerinizdeki anormallikleri tespit edin
- **Doğal Dil Sorguları**: Verilerinizi sohbet ederek sorgulayın

### 3. İşbirliği Araçları
- **Takım Yönetimi**: Ekip üyelerinizi yönetin
- **Paylaşım**: Raporları ve analizleri paylaşın
- **Roller ve İzinler**: Detaylı yetkilendirme sistemi

## Paket Seçenekleri

### Custom Paket
- **Fiyat**: Özel fiyatlandırma
- **Özellikler**: 
  - Tüm özelliklere erişim
  - Sınırsız kullanıcı
  - Öncelikli destek
  - Özel entegrasyonlar
  - API erişimi
  - Özelleştirilebilir dashboard
  - Veri güvenliği ve yedekleme
  - Eğitim ve onboarding

## Affiliate Programı
- **Komisyon Oranı**: Her satıştan %30 komisyon
- **Özel Link**: Kişisel referans linki
- **Dashboard**: Kazançlarınızı takip edin
- **Ödeme**: Aylık otomatik ödemeler
- **Destek**: Affiliate özel destek ekibi

## Referral Programı
- **Arkadaş Davet Et**: Arkadaşlarınızı platforma davet edin
- **Ödüller**: Her başarılı kayıt için ödüller kazanın
- **Kolay Paylaşım**: Özel referral kodu ile paylaşım

## Teknik Destek
- **7/24 Destek**: Her zaman ulaşılabilir destek ekibi
- **Canlı Chat**: Anlık destek için chatbot
- **E-posta**: support@aishe.app
- **Dokümantasyon**: Detaylı kullanım kılavuzları
- **Video Eğitimler**: Adım adım eğitim videoları

## Güvenlik
- **SSL Şifreleme**: Tüm veriler şifreli
- **GDPR Uyumlu**: Avrupa veri koruma standartlarına uygun
- **Düzenli Yedekler**: Otomatik veri yedekleme
- **İki Faktörlü Doğrulama**: Hesap güvenliği için 2FA

## İletişim
- **Web**: https://aishe.app
- **E-posta**: demo@aishe.local
- **Destek**: Her dilde destek mevcut
`;

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async getChatResponse(question: string, lang?: string) {
    const language = (lang || DEFAULT_LANG).trim() || DEFAULT_LANG;
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const docsContext = process.env.AISHE_DOC_CONTEXT ?? AISHE_KNOWLEDGE;

    console.log('=== SUPPORT SERVICE DEBUG ===');
    console.log('Question:', question);
    console.log('Language:', language);
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    console.log('Model:', model);
    console.log('=============================');

    const systemPrompt = `Sen AISHE platformunun resmi destek asistanısın. 

Görevin:
- Kullanıcılara AISHE hakkında detaylı, doğru ve yardımcı bilgiler vermek
- Profesyonel ama samimi bir ton kullanmak
- Markdown formatında güzel yapılandırılmış yanıtlar vermek
- Kod örnekleri gerekirse \`\`\`kod\`\`\` formatında paylaşmak
- Liste ve başlıklar kullanarak okunabilir yanıtlar oluşturmak

Kullanıcının dil tercihi: ${language}
Lütfen tüm yanıtlarını ${language} dilinde ver.

AISHE Platform Bilgileri:
${docsContext}

Yanıt Kuralları:
1. Kısa ve öz yanıtlar ver
2. Markdown formatını kullan (başlıklar, listeler, kalın yazı)
3. Gerekirse emoji kullan (ama abartma)
4. Kullanıcıya özel paket önerileri sun
5. Sorduğu soruya tam olarak cevap ver
6. Bilmediğin bir şey sorulursa dürüst ol ve destek ekibine yönlendir`;

    if (!apiKey) {
      return {
        answer:
          language.startsWith('tr')
            ? `## ⚠️ Geçici Hizmet Kesintisi\n\nŞu anda OpenAI API servisine erişemiyoruz.\n\n**Alternatif destek:**\n- 📧 E-posta: demo@aishe.local\n- 💬 Tekrar deneyin: Birkaç dakika sonra\n\nYardımcı olmak için sabırsızlanıyoruz! 🙏`
            : `## ⚠️ Temporary Service Interruption\n\nWe cannot reach OpenAI API service at the moment.\n\n**Alternative support:**\n- 📧 Email: demo@aishe.local\n- 💬 Try again: In a few minutes\n\nWe're eager to help! 🙏`,
      };
    }

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new AppError('Destek yanıtı alınamadı.', 502, ErrorCodes.INTERNAL_ERROR);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new AppError('Destek yanıtı boş döndü.', 502, ErrorCodes.INTERNAL_ERROR);
    }

    return { answer };
  }

  // Ticket Management Methods
  async createTicket(userId: string, dto: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        description: dto.description,
        category: dto.category || 'GENERAL',
        priority: dto.priority || 'MEDIUM',
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async getUserTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });
  }

  async getAllTickets() {
    return this.prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    });
  }

  async getTicketById(ticketId: string, userId?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError('Ticket bulunamadı', 404, ErrorCodes.INTERNAL_ERROR);
    }

    // Eğer kullanıcı ID'si verilmişse, sadece kendi ticket'ına erişebilir
    if (userId && ticket.userId !== userId) {
      throw new AppError('Bu ticket\'a erişim yetkiniz yok', 403, ErrorCodes.FORBIDDEN);
    }

    return ticket;
  }

  async updateTicketStatus(ticketId: string, status: any) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new AppError('Ticket bulunamadı', 404, ErrorCodes.INTERNAL_ERROR);
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        closedAt: status === 'CLOSED' || status === 'RESOLVED' ? new Date() : null,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async addReply(ticketId: string, userId: string, dto: AddReplyDto, isStaff: boolean = false) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new AppError('Ticket bulunamadı', 404, ErrorCodes.INTERNAL_ERROR);
    }

    // Kullanıcı kendi ticket'ına veya admin herhangi bir ticket'a reply ekleyebilir
    if (!isStaff && ticket.userId !== userId) {
      throw new AppError('Bu ticket\'a erişim yetkiniz yok', 403, ErrorCodes.FORBIDDEN);
    }

    const reply = await this.prisma.supportTicketReply.create({
      data: {
        ticketId,
        userId,
        message: dto.message,
        isStaff,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    // Ticket'ı otomatik olarak IN_PROGRESS yap
    if (ticket.status === 'OPEN') {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return reply;
  }

  async deleteTicket(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new AppError('Ticket bulunamadı', 404, ErrorCodes.INTERNAL_ERROR);
    }

    await this.prisma.supportTicket.delete({
      where: { id: ticketId },
    });

    return { message: 'Ticket başarıyla silindi' };
  }
}
