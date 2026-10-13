import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../../auth/types/auth.types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SkipCsrf } from '../../../common/decorators/skip-csrf.decorator';
import { ROLE } from '../../../common/enums/role.enum';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { type CreatePaymentDto, createPaymentSchema } from '../dto/create-payment.dto';
import { PaymentWebhookService } from '../services/payment-webhook.service';
import { PAYMENTS_ROUTES, WEBHOOK_SIGNATURE_HEADER } from '../constants/payments.constants';
import { PaymentsService } from '../services/payments.service';
import type { StartedPayment } from '../types/payments.types';

@Controller(PAYMENTS_ROUTES.BASE)
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly webhook: PaymentWebhookService,
  ) {}

  @Post()
  @Roles(ROLE.CLIENT)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPaymentSchema)) dto: CreatePaymentDto,
  ): Promise<StartedPayment> {
    return this.payments.start(user.userId, dto.orderId);
  }

  // Called by the payment system, not by a browser: there is no login and no CSRF header,
  // the signature over the raw body proves the sender.
  @Post(PAYMENTS_ROUTES.WEBHOOK)
  @Public()
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  receiveWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers(WEBHOOK_SIGNATURE_HEADER) signature: string | undefined,
  ): Promise<void> {
    return this.webhook.process(request.rawBody, signature);
  }
}
