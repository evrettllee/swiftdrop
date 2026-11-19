import type { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';
import { LogMailGateway } from './adapters/log-mail.gateway';
import { SmtpMailGateway } from './adapters/smtp-mail.gateway';
import { createMailGateway } from './mail.module';

const SMTP_CONFIG: Record<string, unknown> = {
  [ENV_KEYS.NODE_ENV]: 'development',
  [ENV_KEYS.MAIL_HOST]: 'smtp.example.com',
  [ENV_KEYS.MAIL_PORT]: 465,
  [ENV_KEYS.MAIL_SECURE]: true,
  [ENV_KEYS.MAIL_USER]: 'user',
  [ENV_KEYS.MAIL_PASSWORD]: 'password',
  [ENV_KEYS.MAIL_FROM]: 'SwiftDrop <no-reply@example.com>',
};

function configOf(values: Record<string, unknown>): ConfigService {
  const get = (key: string) => values[key];
  const getOrThrow = (key: string) => {
    if (values[key] === undefined) {
      throw new Error(`${key} is missing`);
    }

    return values[key];
  };

  return { get, getOrThrow } as unknown as ConfigService;
}

describe('createMailGateway', () => {
  it('should only log mails when the host is empty outside production', () => {
    const gateway = createMailGateway(configOf({ [ENV_KEYS.NODE_ENV]: 'development' }));

    expect(gateway).toBeInstanceOf(LogMailGateway);
  });

  it('should send through SMTP when the host is set', () => {
    expect(createMailGateway(configOf(SMTP_CONFIG))).toBeInstanceOf(SmtpMailGateway);
  });

  it('should refuse to log mails instead of sending when production has no host', () => {
    expect(() => createMailGateway(configOf({ [ENV_KEYS.NODE_ENV]: 'production' }))).toThrow();
  });
});
