import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { ENV_KEYS, NODE_ENV_PRODUCTION } from '@/config/env.constants';
import { LogMailGateway } from './adapters/log-mail.gateway';
import { SmtpMailGateway } from './adapters/smtp-mail.gateway';
import { MailGateway } from './contracts/mail.gateway';

export function createMailGateway(config: ConfigService): MailGateway {
  const host = config.get<string>(ENV_KEYS.MAIL_HOST) ?? '';
  const isProduction = config.get<string>(ENV_KEYS.NODE_ENV) === NODE_ENV_PRODUCTION;

  if (host === '') {
    if (isProduction) {
      throw new Error(`${ENV_KEYS.MAIL_HOST} is required in production`);
    }

    return new LogMailGateway();
  }

  const transport = createTransport({
    host,
    port: config.get<number>(ENV_KEYS.MAIL_PORT),
    secure: config.get<boolean>(ENV_KEYS.MAIL_SECURE),
    auth: {
      user: config.get<string>(ENV_KEYS.MAIL_USER) ?? '',
      pass: config.get<string>(ENV_KEYS.MAIL_PASSWORD) ?? '',
    },
  });

  return new SmtpMailGateway(transport, config.get<string>(ENV_KEYS.MAIL_FROM) ?? '');
}

@Module({
  providers: [{ provide: MailGateway, inject: [ConfigService], useFactory: createMailGateway }],
  exports: [MailGateway],
})
export class MailModule {}
