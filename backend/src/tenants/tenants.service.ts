import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateManagedTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  // Get all tenants the current user can access (own + managed)
  async getAccessibleTenants(userId: string, primaryTenantId: string) {
    const [primaryTenant, managedAccess] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: primaryTenantId },
        select: { id: true, name: true, ice: true, city: true, currency: true, tvaRate: true },
      }),
      this.prisma.userTenantAccess.findMany({
        where: { userId },
        include: {
          tenant: {
            select: { id: true, name: true, ice: true, city: true, currency: true, tvaRate: true },
          },
        },
      }),
    ]);

    const tenants = [];
    if (primaryTenant) {
      tenants.push({ ...primaryTenant, isPrimary: true });
    }
    for (const access of managedAccess) {
      if (access.tenantId !== primaryTenantId) {
        tenants.push({ ...access.tenant, isPrimary: false, accessRole: access.role });
      }
    }

    return tenants;
  }

  // Create a managed tenant (fiduciary adds a client company)
  async createManagedTenant(
    dto: CreateManagedTenantDto,
    userId: string,
    parentTenantId: string,
  ) {
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        ice: dto.ice,
        rc: dto.rc,
        taxId: dto.taxId,
        address: dto.address,
        city: dto.city,
        country: dto.country || 'MA',
        phone: dto.phone,
        email: dto.email,
        currency: dto.currency || 'MAD',
        tvaRate: dto.tvaRate ?? 20,
        parentTenantId,
      },
    });

    // Grant the user access to this tenant
    await this.prisma.userTenantAccess.create({
      data: {
        userId,
        tenantId: tenant.id,
        role: 'ADMIN',
      },
    });

    return tenant;
  }

  // Get child tenants (tenants managed by the parent)
  async getChildTenants(parentTenantId: string) {
    return this.prisma.tenant.findMany({
      where: { parentTenantId },
      select: {
        id: true,
        name: true,
        ice: true,
        rc: true,
        city: true,
        currency: true,
        isActive: true,
        _count: { select: { invoices: true, clients: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Consolidated dashboard for fiduciary (across all managed tenants)
  async getConsolidatedDashboard(userId: string, parentTenantId: string) {
    const accessList = await this.prisma.userTenantAccess.findMany({
      where: { userId },
      select: { tenantId: true },
    });

    const tenantIds = [parentTenantId, ...accessList.map((a) => a.tenantId)];
    const uniqueTenantIds = [...new Set(tenantIds)];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [invoices, clients, tenants] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { tenantId: { in: uniqueTenantIds } },
        select: {
          total: true,
          status: true,
          dueDate: true,
          tenantId: true,
          createdAt: true,
        },
      }),
      this.prisma.client.count({ where: { tenantId: { in: uniqueTenantIds } } }),
      this.prisma.tenant.findMany({
        where: { id: { in: uniqueTenantIds } },
        select: { id: true, name: true },
      }),
    ]);

    // Per-tenant summary
    const tenantSummaries = tenants.map((t) => {
      const tInvoices = invoices.filter((i) => i.tenantId === t.id);
      const paid = tInvoices.filter((i) => i.status === 'PAID');
      const overdue = tInvoices.filter(
        (i) => (i.status === 'OVERDUE' || i.status === 'SENT') && i.dueDate < now,
      );
      return {
        tenantId: t.id,
        tenantName: t.name,
        totalRevenue: paid.reduce((s, i) => s + i.total, 0),
        totalOverdue: overdue.reduce((s, i) => s + i.total, 0),
        totalInvoices: tInvoices.length,
        paidCount: paid.length,
        overdueCount: overdue.length,
      };
    });

    // Global totals
    const totalRevenue = tenantSummaries.reduce((s, t) => s + t.totalRevenue, 0);
    const totalOverdue = tenantSummaries.reduce((s, t) => s + t.totalOverdue, 0);
    const totalInvoices = tenantSummaries.reduce((s, t) => s + t.totalInvoices, 0);

    return {
      global: {
        totalRevenue,
        totalOverdue,
        totalInvoices,
        totalClients: clients,
        tenantCount: uniqueTenantIds.length,
      },
      tenants: tenantSummaries,
    };
  }

  // Verify user has access to a tenant (for switching)
  async verifyAccess(userId: string, targetTenantId: string, primaryTenantId: string): Promise<boolean> {
    if (targetTenantId === primaryTenantId) return true;
    const access = await this.prisma.userTenantAccess.findUnique({
      where: { userId_tenantId: { userId, tenantId: targetTenantId } },
    });
    return !!access;
  }
}
