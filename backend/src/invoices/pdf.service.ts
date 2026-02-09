import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

interface PdfInvoiceData {
  number: string;
  date: string;
  dueDate: string;
  status: string;
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  total: number;
  currency: string;
  notes?: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  client: { name: string; address?: string; city?: string; ice?: string };
  tenant: { name: string; address?: string; city?: string; ice?: string; rc?: string; phone?: string; email?: string };
}

@Injectable()
export class PdfService {
  generateInvoicePdf(data: PdfInvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(data.tenant.name, 50, 50);
      doc.fontSize(9).font('Helvetica')
        .text(data.tenant.address || '', 50, 75)
        .text(`${data.tenant.city || ''} | Tel: ${data.tenant.phone || ''}`, 50, 88)
        .text(`ICE: ${data.tenant.ice || 'N/A'} | RC: ${data.tenant.rc || 'N/A'}`, 50, 101);

      // Invoice title
      doc.fontSize(16).font('Helvetica-Bold')
        .text(`FACTURE ${data.number}`, 350, 50, { align: 'right' });
      doc.fontSize(9).font('Helvetica')
        .text(`Date: ${new Date(data.date).toLocaleDateString('fr-FR')}`, 350, 75, { align: 'right' })
        .text(`Echeance: ${new Date(data.dueDate).toLocaleDateString('fr-FR')}`, 350, 88, { align: 'right' });

      // Separator
      doc.moveTo(50, 125).lineTo(545, 125).stroke();

      // Client info
      doc.fontSize(10).font('Helvetica-Bold').text('FACTURER A:', 50, 140);
      doc.fontSize(9).font('Helvetica')
        .text(data.client.name, 50, 155)
        .text(data.client.address || '', 50, 168)
        .text(data.client.city || '', 50, 181)
        .text(data.client.ice ? `ICE: ${data.client.ice}` : '', 50, 194);

      // Items table header
      const tableTop = 230;
      doc.rect(50, tableTop, 495, 20).fill('#2563eb');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
        .text('Description', 55, tableTop + 5, { width: 250 })
        .text('Qte', 310, tableTop + 5, { width: 50, align: 'center' })
        .text('Prix Unit.', 365, tableTop + 5, { width: 80, align: 'right' })
        .text('Total', 450, tableTop + 5, { width: 90, align: 'right' });

      // Items
      let yPos = tableTop + 25;
      doc.fillColor('#000000').font('Helvetica');
      data.items.forEach((item, i) => {
        const bg = i % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(50, yPos - 3, 495, 18).fill(bg);
        doc.fillColor('#000000')
          .text(item.description, 55, yPos, { width: 250 })
          .text(String(item.quantity), 310, yPos, { width: 50, align: 'center' })
          .text(`${item.unitPrice.toFixed(2)}`, 365, yPos, { width: 80, align: 'right' })
          .text(`${(item.quantity * item.unitPrice).toFixed(2)}`, 450, yPos, { width: 90, align: 'right' });
        yPos += 20;
      });

      // Totals
      yPos += 15;
      doc.moveTo(350, yPos).lineTo(545, yPos).stroke();
      yPos += 10;

      doc.font('Helvetica')
        .text('Sous-total HT:', 350, yPos, { width: 100 })
        .text(`${data.subtotal.toFixed(2)} ${data.currency}`, 450, yPos, { width: 90, align: 'right' });
      yPos += 18;

      doc.text(`TVA (${data.tvaRate}%):`, 350, yPos, { width: 100 })
        .text(`${data.tvaAmount.toFixed(2)} ${data.currency}`, 450, yPos, { width: 90, align: 'right' });
      yPos += 18;

      doc.moveTo(350, yPos).lineTo(545, yPos).stroke();
      yPos += 8;

      doc.fontSize(12).font('Helvetica-Bold')
        .text('TOTAL TTC:', 350, yPos, { width: 100 })
        .text(`${data.total.toFixed(2)} ${data.currency}`, 440, yPos, { width: 100, align: 'right' });

      // Notes
      if (data.notes) {
        yPos += 40;
        doc.fontSize(9).font('Helvetica-Bold').text('Notes:', 50, yPos);
        doc.font('Helvetica').text(data.notes, 50, yPos + 15, { width: 400 });
      }

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#666666')
        .text(
          `${data.tenant.name} | ICE: ${data.tenant.ice || 'N/A'} | RC: ${data.tenant.rc || 'N/A'}`,
          50, 750, { align: 'center', width: 495 },
        );

      doc.end();
    });
  }
}
