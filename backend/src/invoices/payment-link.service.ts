import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PaymentLinkService {
  constructor(private prisma: PrismaService) {}

  async createPaymentLink(invoiceId: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { client: true, tenant: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // Expires in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const link = await this.prisma.paymentLink.create({
      data: {
        tenantId,
        invoiceId,
        amount: invoice.total,
        currency: invoice.currency,
        expiresAt,
      },
    });

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const paymentUrl = `${appUrl}/pay/${link.token}`;

    return {
      id: link.id,
      token: link.token,
      url: paymentUrl,
      amount: link.amount,
      currency: link.currency,
      expiresAt: link.expiresAt,
      invoice: {
        number: invoice.number,
        client: invoice.client.name,
      },
    };
  }

  // Public: get payment info by token (no auth required)
  async getPaymentInfo(token: string) {
    const link = await this.prisma.paymentLink.findUnique({
      where: { token },
      include: {
        invoice: {
          include: {
            client: { select: { name: true, ice: true } },
          },
        },
        tenant: {
          select: { name: true, ice: true, rc: true, phone: true, email: true, address: true, city: true },
        },
      },
    });

    if (!link) throw new NotFoundException('Lien de paiement introuvable');

    const isExpired = new Date() > link.expiresAt;

    return {
      token: link.token,
      amount: link.amount,
      currency: link.currency,
      isPaid: link.isPaid,
      isExpired,
      expiresAt: link.expiresAt,
      invoice: {
        number: link.invoice.number,
        date: link.invoice.date,
        dueDate: link.invoice.dueDate,
        items: link.invoice.items,
        subtotal: link.invoice.subtotal,
        tvaRate: link.invoice.tvaRate,
        tvaAmount: link.invoice.tvaAmount,
        total: link.invoice.total,
        client: link.invoice.client,
      },
      company: link.tenant,
    };
  }

  // Public: confirm payment by token
  async confirmPayment(token: string, method: string, notes?: string) {
    const link = await this.prisma.paymentLink.findUnique({
      where: { token },
    });

    if (!link) throw new NotFoundException('Lien de paiement introuvable');
    if (link.isPaid) return { message: 'Paiement deja enregistre' };
    if (new Date() > link.expiresAt) return { message: 'Lien de paiement expire' };

    // Mark payment link as paid
    await this.prisma.paymentLink.update({
      where: { id: link.id },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paidMethod: method,
        notes,
      },
    });

    // Update invoice status to PAID
    await this.prisma.invoice.update({
      where: { id: link.invoiceId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    return { message: 'Paiement enregistre avec succes' };
  }

  // Get all payment links for a tenant
  async getPaymentLinks(tenantId: string) {
    return this.prisma.paymentLink.findMany({
      where: { tenantId },
      include: {
        invoice: {
          select: { number: true, client: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
