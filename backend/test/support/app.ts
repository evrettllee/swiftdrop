import type { Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

export type ProviderOverride = { token: Type<unknown>; useValue: unknown };

// Overrides replace real providers, for example an external service that tests must not call.
export async function createTestApp(
  overrides: ProviderOverride[] = [],
): Promise<NestExpressApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] });

  for (const { token, useValue } of overrides) {
    builder.overrideProvider(token).useValue(useValue);
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();

  configureApp(app);
  // Lets tests set the client address through X-Forwarded-For.
  app.set('trust proxy', true);
  await app.init();

  return app;
}
