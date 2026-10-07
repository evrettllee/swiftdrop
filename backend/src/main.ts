import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { GLOBAL_PREFIX } from './common/constants/http';
import { ENV_KEYS } from './config/env.constants';

async function bootstrap() {
  // The raw body is kept for checking the signature of payment notifications.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  configureApp(app);
  app.enableShutdownHooks();

  const port = config.getOrThrow<number>(ENV_KEYS.PORT);
  await app.listen(port);

  Logger.log(`Backend listening on http://localhost:${port}/${GLOBAL_PREFIX}`, 'Bootstrap');
}

void bootstrap();
