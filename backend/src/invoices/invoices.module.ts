import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PaymentLinkController } from './payment-link.controller';
import { PdfService } from './pdf.service';
import { ExportService } from './export.service';
import { PaymentLinkService } from './payment-link.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [InvoicesController, PaymentLinkController],
  providers: [InvoicesService, PdfService, ExportService, PaymentLinkService],
  exports: [InvoicesService, PaymentLinkService],
})
export class InvoicesModule {}
