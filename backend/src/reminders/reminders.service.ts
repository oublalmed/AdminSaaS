import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateReminderDto, AiGenerateReminderDto } from './dto/reminder.dto';

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async create(dto: CreateReminderDto, userId: string, tenantId: string) {
    return this.prisma.reminder.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        invoiceId: dto.invoiceId,
        userId,
        channel: dto.channel,
        message: dto.message || '',
        scheduledAt: new Date(dto.scheduledAt),
      },
      include: { client: true, invoice: true },
    });
  }

  async aiGenerateReminder(
    dto: AiGenerateReminderDto,
    userId: string,
    tenantId: string,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, tenantId },
      include: { client: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const daysOverdue = Math.floor(
      (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const message = await this.aiService.generateReminderMessage({
      clientName: invoice.client.name,
      invoiceNumber: invoice.number,
      amount: invoice.total,
      currency: invoice.currency,
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      daysOverdue: Math.max(0, daysOverdue),
      channel: dto.channel,
      language: dto.language,
    });

    const scheduledAt = new Date();
    scheduledAt.setHours(scheduledAt.getHours() + 1);

    return this.prisma.reminder.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        invoiceId: dto.invoiceId,
        userId,
        channel: dto.channel,
        message,
        scheduledAt,
        aiGenerated: true,
      },
      include: { client: true, invoice: true },
    });
  }

  async findAll(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.prisma.reminder.findMany({
      where,
      include: { client: true, invoice: true },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id, tenantId },
      include: { client: true, invoice: true },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');
    return reminder;
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.reminder.delete({ where: { id } });
  }

  // Cron job: check and send pending reminders every 15 minutes
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingReminders() {
    const pendingReminders = await this.prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: new Date() },
      },
      include: { client: true, invoice: true, tenant: true },
    });

    for (const reminder of pendingReminders) {
      try {
        await this.sendReminder(reminder);
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error);
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: 'FAILED' },
        });
      }
    }
  }

  // Cron job: auto-create reminders for overdue invoices daily at 9 AM
  @Cron('0 9 * * *')
  async autoCreateReminders() {
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: 'SENT',
        dueDate: { lt: new Date() },
      },
      include: { client: true, tenant: true, user: true },
    });

    for (const invoice of overdueInvoices) {
      const existingReminder = await this.prisma.reminder.findFirst({
        where: {
          invoiceId: invoice.id,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingReminder && invoice.client.email) {
        const daysOverdue = Math.floor(
          (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        try {
          const message = await this.aiService.generateReminderMessage({
            clientName: invoice.client.name,
            invoiceNumber: invoice.number,
            amount: invoice.total,
            currency: invoice.currency,
            dueDate: invoice.dueDate.toISOString().split('T')[0],
            daysOverdue,
            channel: 'EMAIL',
          });

          await this.prisma.reminder.create({
            data: {
              tenantId: invoice.tenantId,
              clientId: invoice.clientId,
              invoiceId: invoice.id,
              userId: invoice.userId,
              channel: 'EMAIL',
              message,
              scheduledAt: new Date(),
              aiGenerated: true,
            },
          });

          // Update invoice status to OVERDUE
          await this.prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'OVERDUE' },
          });
        } catch (error) {
          console.error(`Auto-reminder failed for invoice ${invoice.id}:`, error);
        }
      }
    }
  }

  private async sendReminder(reminder: any) {
    // In production, integrate with actual email/SMS/WhatsApp providers
    switch (reminder.channel) {
      case 'EMAIL':
        console.log(`[EMAIL] To: ${reminder.client.email} | ${reminder.message}`);
        break;
      case 'SMS':
        console.log(`[SMS] To: ${reminder.client.phone} | ${reminder.message}`);
        break;
      case 'WHATSAPP':
        console.log(`[WHATSAPP] To: ${reminder.client.phone} | ${reminder.message}`);
        break;
    }
  }
}
