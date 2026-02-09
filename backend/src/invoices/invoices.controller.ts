import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { PdfService } from './pdf.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreateQuoteDto,
  UpdateQuoteDto,
  AiGenerateInvoiceDto,
} from './dto/invoice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../common/prisma.service';

@ApiTags('Invoices & Quotes')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private pdfService: PdfService,
    private prisma: PrismaService,
  ) {}

  // --- Invoices ---

  @Post('invoices')
  createInvoice(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.invoicesService.createInvoice(dto, userId, tenantId);
  }

  @Get('invoices')
  findAllInvoices(
    @CurrentUser('tenantId') tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.invoicesService.findAllInvoices(tenantId, pagination, status);
  }

  @Get('invoices/:id')
  findOneInvoice(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.invoicesService.findOneInvoice(id, tenantId);
  }

  @Get('invoices/:id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    const invoice = await this.invoicesService.findOneInvoice(id, tenantId);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    const pdf = await this.pdfService.generateInvoicePdf({
      number: invoice.number,
      date: invoice.date.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.status,
      subtotal: invoice.subtotal,
      tvaRate: invoice.tvaRate,
      tvaAmount: invoice.tvaAmount,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes,
      items: invoice.items as any,
      client: invoice.client,
      tenant,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.number}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @Put('invoices/:id')
  updateInvoice(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.invoicesService.updateInvoice(id, dto, tenantId);
  }

  @Delete('invoices/:id')
  deleteInvoice(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.invoicesService.deleteInvoice(id, tenantId);
  }

  @Post('invoices/ai-generate')
  aiGenerate(
    @Body() dto: AiGenerateInvoiceDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.invoicesService.aiGenerateInvoice(dto, userId, tenantId);
  }

  // --- Quotes ---

  @Post('quotes')
  createQuote(
    @Body() dto: CreateQuoteDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.invoicesService.createQuote(dto, userId, tenantId);
  }

  @Get('quotes')
  findAllQuotes(
    @CurrentUser('tenantId') tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.invoicesService.findAllQuotes(tenantId, pagination, status);
  }

  @Get('quotes/:id')
  findOneQuote(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.invoicesService.findOneQuote(id, tenantId);
  }

  @Put('quotes/:id')
  updateQuote(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.invoicesService.updateQuote(id, dto, tenantId);
  }

  @Delete('quotes/:id')
  deleteQuote(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.invoicesService.deleteQuote(id, tenantId);
  }
}
