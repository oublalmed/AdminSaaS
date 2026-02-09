import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  // Export invoices as CSV
  async exportCSV(tenantId: string, filters: ExportFilters): Promise<string> {
    const invoices = await this.getInvoices(tenantId, filters);

    const headers = [
      'Numero',
      'Date',
      'Echeance',
      'Statut',
      'Client',
      'ICE Client',
      'Sous-total HT',
      'Taux TVA',
      'Montant TVA',
      'Total TTC',
      'Devise',
      'Date Paiement',
    ];

    const rows = invoices.map((inv) => [
      inv.number,
      this.formatDate(inv.date),
      this.formatDate(inv.dueDate),
      inv.status,
      inv.client.name,
      inv.client.ice || '',
      inv.subtotal.toFixed(2),
      inv.tvaRate.toFixed(2),
      inv.tvaAmount.toFixed(2),
      inv.total.toFixed(2),
      inv.currency,
      inv.paidAt ? this.formatDate(inv.paidAt) : '',
    ]);

    return this.buildCSV(headers, rows);
  }

  // Export FEC (Fichier des Ecritures Comptables) format
  // Required by DGI Morocco & French accounting standards
  async exportFEC(tenantId: string, filters: ExportFilters): Promise<string> {
    const [invoices, tenant] = await Promise.all([
      this.getInvoices(tenantId, filters),
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
    ]);

    // FEC columns per French/Moroccan standard
    const headers = [
      'JournalCode',
      'JournalLib',
      'EcritureNum',
      'EcritureDate',
      'CompteNum',
      'CompteLib',
      'CompAuxNum',
      'CompAuxLib',
      'PieceRef',
      'PieceDate',
      'EcritureLib',
      'Debit',
      'Credit',
      'EcrtureLet',
      'DateLet',
      'ValidDate',
      'Montantdevise',
      'Idevise',
    ];

    const rows: string[][] = [];
    let entryNum = 1;

    for (const inv of invoices) {
      const dateStr = this.formatDateFEC(inv.date);
      const baseRef = inv.number;

      // Entry 1: Client debit (TTC) - Account 3421 (Clients)
      rows.push([
        'VE',
        'Journal des ventes',
        String(entryNum),
        dateStr,
        '3421',
        'Clients',
        inv.client.ice || inv.clientId.substring(0, 8),
        inv.client.name,
        baseRef,
        dateStr,
        `Facture ${inv.number} - ${inv.client.name}`,
        inv.total.toFixed(2),
        '0.00',
        '',
        '',
        dateStr,
        inv.total.toFixed(2),
        inv.currency,
      ]);

      // Entry 2: Revenue credit (HT) - Account 7111 (Ventes de marchandises)
      rows.push([
        'VE',
        'Journal des ventes',
        String(entryNum),
        dateStr,
        '7111',
        'Ventes de marchandises au Maroc',
        '',
        '',
        baseRef,
        dateStr,
        `Facture ${inv.number} - ${inv.client.name}`,
        '0.00',
        inv.subtotal.toFixed(2),
        '',
        '',
        dateStr,
        inv.subtotal.toFixed(2),
        inv.currency,
      ]);

      // Entry 3: TVA credit - Account 4455 (Etat TVA facturee)
      if (inv.tvaAmount > 0) {
        rows.push([
          'VE',
          'Journal des ventes',
          String(entryNum),
          dateStr,
          '4455',
          'Etat - TVA facturee',
          '',
          '',
          baseRef,
          dateStr,
          `TVA ${inv.tvaRate}% - Facture ${inv.number}`,
          '0.00',
          inv.tvaAmount.toFixed(2),
          '',
          '',
          dateStr,
          inv.tvaAmount.toFixed(2),
          inv.currency,
        ]);
      }

      // Entry 4: Payment if paid - Account 5141 (Banque)
      if (inv.status === 'PAID' && inv.paidAt) {
        const paidDateStr = this.formatDateFEC(inv.paidAt);
        entryNum++;
        rows.push([
          'BQ',
          'Journal de banque',
          String(entryNum),
          paidDateStr,
          '5141',
          'Banque',
          '',
          '',
          baseRef,
          paidDateStr,
          `Reglement Facture ${inv.number} - ${inv.client.name}`,
          inv.total.toFixed(2),
          '0.00',
          '',
          '',
          paidDateStr,
          inv.total.toFixed(2),
          inv.currency,
        ]);

        rows.push([
          'BQ',
          'Journal de banque',
          String(entryNum),
          paidDateStr,
          '3421',
          'Clients',
          inv.client.ice || inv.clientId.substring(0, 8),
          inv.client.name,
          baseRef,
          paidDateStr,
          `Reglement Facture ${inv.number} - ${inv.client.name}`,
          '0.00',
          inv.total.toFixed(2),
          '',
          '',
          paidDateStr,
          inv.total.toFixed(2),
          inv.currency,
        ]);
      }

      entryNum++;
    }

    return this.buildCSV(headers, rows, '\t');
  }

  private async getInvoices(tenantId: string, filters: ExportFilters) {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    return this.prisma.invoice.findMany({
      where,
      include: { client: { select: { name: true, ice: true } } },
      orderBy: { date: 'asc' },
    });
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private formatDateFEC(date: Date | string): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}${month}${day}`;
  }

  private buildCSV(headers: string[], rows: string[][], separator = ','): string {
    const escapeField = (field: string) => {
      if (field.includes(separator) || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const lines = [
      headers.map(escapeField).join(separator),
      ...rows.map((row) => row.map(escapeField).join(separator)),
    ];

    return lines.join('\n');
  }
}
