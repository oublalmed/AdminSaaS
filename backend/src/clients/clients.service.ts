import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClientDto, tenantId: string) {
    return this.prisma.client.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, search?: string) {
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { ice: { contains: search } },
        { cin: { contains: search } },
      ];
    }
    return this.prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        reminders: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.client.delete({ where: { id } });
  }

  async getClientStats(tenantId: string) {
    const [total, verified, atRisk] = await Promise.all([
      this.prisma.client.count({ where: { tenantId } }),
      this.prisma.client.count({ where: { tenantId, isVerified: true } }),
      this.prisma.client.count({ where: { tenantId, riskScore: { gte: 70 } } }),
    ]);
    return { total, verified, atRisk };
  }
}
