import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreateQuoteDto,
  UpdateQuoteDto,
  AiGenerateInvoiceDto,
} from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  // --- Invoices ---

  async createInvoice(dto: CreateInvoiceDto, userId: string, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    const tvaRate = dto.tvaRate ?? tenant.tvaRate ?? 20;
    const currency = dto.currency ?? tenant.currency ?? 'MAD';

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const tvaAmount = subtotal * (tvaRate / 100);
    const total = subtotal + tvaAmount;

    const count = await this.prisma.invoice.count({ where: { tenantId } });
    const number = `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.invoice.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        userId,
        number,
        dueDate: new Date(dto.dueDate),
        subtotal,
        tvaRate,
        tvaAmount,
        total,
        currency,
        notes: dto.notes,
        items: dto.items as any,
      },
      include: { client: true },
    });
  }

  async findAllInvoices(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.prisma.invoice.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInvoice(id: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { client: true, user: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto, tenantId: string) {
    await this.findOneInvoice(id, tenantId);
    const data: any = { ...dto };

    if (dto.items) {
      const subtotal = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
      const invoice = await this.prisma.invoice.findUnique({ where: { id } });
      const tvaAmount = subtotal * (invoice.tvaRate / 100);
      data.subtotal = subtotal;
      data.tvaAmount = tvaAmount;
      data.total = subtotal + tvaAmount;
      data.items = dto.items as any;
    }

    if (dto.status === 'PAID') {
      data.paidAt = new Date();
    }

    if (dto.dueDate) {
      data.dueDate = new Date(dto.dueDate);
    }

    return this.prisma.invoice.update({
      where: { id },
      data,
      include: { client: true },
    });
  }

  async deleteInvoice(id: string, tenantId: string) {
    await this.findOneInvoice(id, tenantId);
    return this.prisma.invoice.delete({ where: { id } });
  }

  async aiGenerateInvoice(
    dto: AiGenerateInvoiceDto,
    userId: string,
    tenantId: string,
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, tenantId },
    });
    if (!client) throw new NotFoundException('Client not found');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const aiResult = await this.aiService.generateInvoice({
      clientName: client.name,
      description: dto.description,
      language: dto.language || 'fr',
      currency: tenant.currency,
      tvaRate: tenant.tvaRate,
    });

    const subtotal = aiResult.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const tvaAmount = subtotal * (tenant.tvaRate / 100);
    const total = subtotal + tvaAmount;

    const count = await this.prisma.invoice.count({ where: { tenantId } });
    const number = `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return this.prisma.invoice.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        userId,
        number,
        dueDate,
        subtotal,
        tvaRate: tenant.tvaRate,
        tvaAmount,
        total,
        currency: tenant.currency,
        notes: aiResult.notes,
        items: aiResult.items as any,
        aiGenerated: true,
      },
      include: { client: true },
    });
  }

  // --- Quotes ---

  async createQuote(dto: CreateQuoteDto, userId: string, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    const tvaRate = dto.tvaRate ?? tenant.tvaRate ?? 20;
    const currency = dto.currency ?? tenant.currency ?? 'MAD';

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const tvaAmount = subtotal * (tvaRate / 100);
    const total = subtotal + tvaAmount;

    const count = await this.prisma.quote.count({ where: { tenantId } });
    const number = `DEV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.quote.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        userId,
        number,
        validUntil: new Date(dto.validUntil),
        subtotal,
        tvaRate,
        tvaAmount,
        total,
        currency,
        notes: dto.notes,
        items: dto.items as any,
      },
      include: { client: true },
    });
  }

  async findAllQuotes(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.prisma.quote.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneQuote(id: string, tenantId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
      include: { client: true, user: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async updateQuote(id: string, dto: UpdateQuoteDto, tenantId: string) {
    await this.findOneQuote(id, tenantId);
    const data: any = { ...dto };

    if (dto.items) {
      const subtotal = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
      const quote = await this.prisma.quote.findUnique({ where: { id } });
      const tvaAmount = subtotal * (quote.tvaRate / 100);
      data.subtotal = subtotal;
      data.tvaAmount = tvaAmount;
      data.total = subtotal + tvaAmount;
      data.items = dto.items as any;
    }

    if (dto.validUntil) {
      data.validUntil = new Date(dto.validUntil);
    }

    return this.prisma.quote.update({
      where: { id },
      data,
      include: { client: true },
    });
  }

  async deleteQuote(id: string, tenantId: string) {
    await this.findOneQuote(id, tenantId);
    return this.prisma.quote.delete({ where: { id } });
  }
}
