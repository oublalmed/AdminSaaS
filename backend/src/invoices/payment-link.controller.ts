import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentLinkService } from './payment-link.service';

// Public controller - no auth required (for payment pages)
@ApiTags('Payment Links')
@Controller('pay')
export class PaymentLinkController {
  constructor(private paymentLinkService: PaymentLinkService) {}

  @Get(':token')
  getPaymentInfo(@Param('token') token: string) {
    return this.paymentLinkService.getPaymentInfo(token);
  }

  @Post(':token/confirm')
  confirmPayment(
    @Param('token') token: string,
    @Body() body: { method: string; notes?: string },
  ) {
    return this.paymentLinkService.confirmPayment(token, body.method, body.notes);
  }
}
