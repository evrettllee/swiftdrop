import type { Abstract, Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

// A token is a class, an abstract one is allowed, for example the payment gateway.
export type ProviderOverride = { token: Type<unknown> | Abstract<unknown>; useValue: unknown };

// Overrides replace real providers, for example an external service that tests must not call.
export async function createTestApp(
  overrides: ProviderOverride[] = [],
): Promise<NestExpressApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] });

  for (const { token, useValue } of overrides) {
    builder.overrideProvider(token).useValue(useValue);
  }

  const moduleRef = await builder.compile();
  // Same as in main.ts: the raw body is kept for checking signatures of payment notifications.
  const app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true });

  configureApp(app);
  // Lets tests set the client address through X-Forwarded-For.
  app.set('trust proxy', true);
  await app.init();

  return app;
}
