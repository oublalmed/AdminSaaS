import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreateQuoteDto,
  UpdateQuoteDto,
  AiGenerateInvoiceDto,
} from './dto/invoice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Invoices & Quotes')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

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
    @Query('status') status?: string,
  ) {
    return this.invoicesService.findAllInvoices(tenantId, status);
  }

  @Get('invoices/:id')
  findOneInvoice(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.invoicesService.findOneInvoice(id, tenantId);
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
    @Query('status') status?: string,
  ) {
    return this.invoicesService.findAllQuotes(tenantId, status);
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
