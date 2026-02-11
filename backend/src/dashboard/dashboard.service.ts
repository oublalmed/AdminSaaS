import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getFinanceDashboard(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      draftInvoices,
      totalQuotes,
      acceptedQuotes,
      totalClients,
      atRiskClients,
      monthlyInvoices,
      yearlyInvoices,
    ] = await Promise.all([
      this.prisma.invoice.count({ where: { tenantId } }),
      this.prisma.invoice.findMany({
        where: { tenantId, status: 'PAID' },
        select: { total: true },
      }),
      this.prisma.invoice.findMany({
        where: { tenantId, status: { in: ['OVERDUE', 'SENT'] }, dueDate: { lt: now } },
        select: { total: true, client: { select: { id: true, name: true } } },
      }),
      this.prisma.invoice.count({ where: { tenantId, status: 'DRAFT' } }),
      this.prisma.quote.count({ where: { tenantId } }),
      this.prisma.quote.count({ where: { tenantId, status: 'ACCEPTED' } }),
      this.prisma.client.count({ where: { tenantId } }),
      this.prisma.client.count({ where: { tenantId, riskScore: { gte: 70 } } }),
      this.prisma.invoice.findMany({
        where: { tenantId, createdAt: { gte: startOfMonth } },
        select: { total: true, status: true },
      }),
      this.prisma.invoice.findMany({
        where: { tenantId, createdAt: { gte: startOfYear } },
        select: { total: true, status: true, createdAt: true },
      }),
    ]);

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.total, 0);
    const monthlyRevenue = monthlyInvoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.total, 0);
    const monthlyTotal = monthlyInvoices.reduce((sum, i) => sum + i.total, 0);

    const cashflow = Array.from({ length: 12 }, (_, i) => {
      const month = i;
      const monthInvs = yearlyInvoices.filter(
        (inv) => new Date(inv.createdAt).getMonth() === month,
      );
      return {
        month: new Date(now.getFullYear(), month).toLocaleString('fr-FR', {
          month: 'short',
        }),
        total: monthInvs.reduce((sum, inv) => sum + inv.total, 0),
        paid: monthInvs
          .filter((inv) => inv.status === 'PAID')
          .reduce((sum, inv) => sum + inv.total, 0),
      };
    });

    const clientRiskMap = new Map<string, { name: string; amount: number }>();
    for (const inv of overdueInvoices) {
      const existing = clientRiskMap.get(inv.client.id);
      if (existing) {
        existing.amount += inv.total;
      } else {
        clientRiskMap.set(inv.client.id, {
          name: inv.client.name,
          amount: inv.total,
        });
      }
    }
    const clientsAtRisk = Array.from(clientRiskMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      summary: {
        totalRevenue,
        totalOverdue,
        totalInvoices,
        paidCount: paidInvoices.length,
        overdueCount: overdueInvoices.length,
        draftCount: draftInvoices,
        totalQuotes,
        acceptedQuotes,
        totalClients,
        atRiskClients,
      },
      monthly: {
        revenue: monthlyRevenue,
        total: monthlyTotal,
        invoiceCount: monthlyInvoices.length,
      },
      cashflow,
      clientsAtRisk,
    };
  }

  // Aging receivables: 0-30, 31-60, 61-90, 90+ days
  async getAgingReceivables(tenantId: string) {
    const now = new Date();

    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['SENT', 'OVERDUE'] },
      },
      include: {
        client: { select: { id: true, name: true, ice: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const buckets = {
      current: { label: '0-30 jours', amount: 0, count: 0, invoices: [] as any[] },
      days31_60: { label: '31-60 jours', amount: 0, count: 0, invoices: [] as any[] },
      days61_90: { label: '61-90 jours', amount: 0, count: 0, invoices: [] as any[] },
      over90: { label: '90+ jours', amount: 0, count: 0, invoices: [] as any[] },
    };

    const clientAging = new Map<string, {
      name: string;
      current: number;
      days31_60: number;
      days61_90: number;
      over90: number;
      total: number;
    }>();

    for (const inv of unpaidInvoices) {
      const daysOverdue = Math.max(0, Math.floor(
        (now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      ));

      const invoiceInfo = {
        id: inv.id,
        number: inv.number,
        client: inv.client.name,
        total: inv.total,
        currency: inv.currency,
        dueDate: inv.dueDate,
        daysOverdue,
      };

      let bucket: keyof typeof buckets;
      if (daysOverdue <= 30) {
        bucket = 'current';
      } else if (daysOverdue <= 60) {
        bucket = 'days31_60';
      } else if (daysOverdue <= 90) {
        bucket = 'days61_90';
      } else {
        bucket = 'over90';
      }

      buckets[bucket].amount += inv.total;
      buckets[bucket].count++;
      buckets[bucket].invoices.push(invoiceInfo);

      const existing = clientAging.get(inv.client.id) || {
        name: inv.client.name,
        current: 0,
        days31_60: 0,
        days61_90: 0,
        over90: 0,
        total: 0,
      };
      existing[bucket] += inv.total;
      existing.total += inv.total;
      clientAging.set(inv.client.id, existing);
    }

    const totalOutstanding = Object.values(buckets).reduce((s, b) => s + b.amount, 0);
    const clientBreakdown = Array.from(clientAging.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    return {
      totalOutstanding,
      buckets: Object.values(buckets),
      clientBreakdown,
      dso: this.calculateDSO(unpaidInvoices, totalOutstanding),
    };
  }

  private calculateDSO(
    unpaidInvoices: Array<{ total: number; dueDate: Date }>,
    totalOutstanding: number,
  ): number {
    if (unpaidInvoices.length === 0) return 0;
    const now = new Date();
    const totalDays = unpaidInvoices.reduce((sum, inv) => {
      return sum + Math.max(0, Math.floor(
        (now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      ));
    }, 0);
    return Math.round(totalDays / unpaidInvoices.length);
  }
}
