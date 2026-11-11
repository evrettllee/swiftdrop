import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { configureApp } from '@/app.setup';
import { GLOBAL_PREFIX } from '@/common/constants/http.constants';
import { ENV_KEYS } from '@/config/env.constants';
import { NbrbService } from '@/integrations/nbrb/services/nbrb.service';
import { StripeCheckoutApi } from '@/integrations/stripe/contracts/stripe-checkout.contract';
import { FakeStripeCheckoutClient } from './fake-stripe';
import { USD_RATE } from './payments';

const FIXED_RATE = { getUsdRate: () => Promise.resolve(USD_RATE) };

export async function startE2eStand(): Promise<void> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(NbrbService)
    .useValue(FIXED_RATE)
    .overrideProvider(StripeCheckoutApi)
    .useValue(new FakeStripeCheckoutClient())
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true });

  configureApp(app);
  app.enableShutdownHooks();

  const port = app.get(ConfigService).getOrThrow<number>(ENV_KEYS.PORT);
  await app.listen(port);

  Logger.log(`E2e stand listening on http://localhost:${port}/${GLOBAL_PREFIX}`, 'Bootstrap');
}
