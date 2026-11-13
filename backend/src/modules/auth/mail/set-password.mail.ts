import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { escapeHtml } from '@/common/utils/escape-html';
import { formatWallDateTime, wallClock } from '@/common/utils/wall-clock';
import type { MailKind, MailMessage } from '@/integrations/mail/types/mail.types';
import { AUTH_MAIL_STYLE as STYLE, AUTH_MAIL_TEXTS as TEXTS } from '../constants/mail.constants';

export type SetPasswordMailParts = {
  kind: MailKind;
  to: string;
  subject: string;
  firstName: string;
  intro: string;
  action: string;
  link: string;
  expiresAt: Date;
};

const PARAGRAPH_STYLE = `margin:0 0 16px;font-size:16px;line-height:24px;color:${STYLE.TEXT}`;
const LINK_STYLE = `margin:0 0 16px;font-size:14px;line-height:20px;color:${STYLE.MUTED_TEXT};word-break:break-all`;
const BUTTON_STYLE = [
  'display:inline-block',
  `background:${STYLE.BUTTON_BACKGROUND}`,
  `color:${STYLE.BUTTON_TEXT}`,
  `border-radius:${STYLE.BUTTON_RADIUS}`,
  `padding:${STYLE.BUTTON_PADDING}`,
  'font-size:16px',
  'line-height:24px',
  'font-weight:600',
  'text-decoration:none',
].join(';');

function paragraph(text: string): string {
  return `<p style="${PARAGRAPH_STYLE}">${escapeHtml(text)}</p>`;
}

export type SetPasswordHtmlParts = {
  subject: string;
  greeting: string;
  intro: string;
  link: string;
  closing: string;
};

export function renderSetPasswordHtml(parts: SetPasswordHtmlParts): string {
  const link = escapeHtml(parts.link);

  return [
    '<!doctype html>',
    `<html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(parts.subject)}</title></head>`,
    `<body style="margin:0;padding:24px 16px;background:${STYLE.PAGE_BACKGROUND};font-family:${STYLE.FONT_FAMILY}">`,
    `<div style="max-width:480px;margin:0 auto;padding:24px;background:${STYLE.CARD_BACKGROUND};border:1px solid ${STYLE.CARD_BORDER};border-radius:12px">`,
    paragraph(parts.greeting),
    paragraph(parts.intro),
    `<p style="margin:0 0 16px"><a href="${link}" style="${BUTTON_STYLE}">${escapeHtml(TEXTS.BUTTON)}</a></p>`,
    `<p style="${LINK_STYLE}">${link}</p>`,
    paragraph(parts.closing),
    '</div></body></html>',
  ].join('');
}

export function buildSetPasswordMail(parts: SetPasswordMailParts): MailMessage {
  const expiry = TEXTS.EXPIRY(formatWallDateTime(wallClock(parts.expiresAt, APP_TIME_ZONE)));
  const greeting = TEXTS.GREETING(parts.firstName);
  const intro = `${parts.intro} ${parts.action}`;
  const text = [greeting, parts.intro, `${parts.action} ${parts.link}.`, expiry].join(' ');

  return {
    kind: parts.kind,
    to: parts.to,
    subject: parts.subject,
    text,
    html: renderSetPasswordHtml({
      subject: parts.subject,
      greeting,
      intro,
      link: parts.link,
      closing: expiry,
    }),
  };
}
