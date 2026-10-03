import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 8080);
  await app.listen(port);

  Logger.log(`Backend listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
