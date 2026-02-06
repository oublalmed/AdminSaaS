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

    // Group by month for cashflow
    const cashflow = Array.from({ length: 12 }, (_, i) => {
      const month = i;
      const monthInvoices = yearlyInvoices.filter(
        (inv) => new Date(inv.createdAt).getMonth() === month,
      );
      return {
        month: new Date(now.getFullYear(), month).toLocaleString('fr-FR', {
          month: 'short',
        }),
        total: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
        paid: monthInvoices
          .filter((inv) => inv.status === 'PAID')
          .reduce((sum, inv) => sum + inv.total, 0),
      };
    });

    // Clients at risk (with overdue invoices)
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
}
