import type { SendMailOptions } from 'nodemailer';
import type { MAIL_KIND_VALUES } from '../constants/mail.constants';

export type MailKind = (typeof MAIL_KIND_VALUES)[number];

export type MailMessage = {
  kind: MailKind;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type MailTransport = {
  sendMail(options: SendMailOptions): Promise<unknown>;
};
