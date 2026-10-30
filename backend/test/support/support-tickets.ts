import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  SUPPORT_ROUTES,
  TICKET_ID_ROUTE_PARAM,
} from '@/modules/support/constants/support.constants';
import { COOKIE_HEADER } from './auth';
import { getApi, postApi } from './http';

function ticketPath(route: string, ticketId: number): string {
  return `${SUPPORT_ROUTES.BASE}/${route.replace(TICKET_ID_ROUTE_PARAM, String(ticketId))}`;
}

function withCookies<T extends { set: (header: string, value: string) => T }>(
  request: T,
  cookies: string | null,
): T {
  return cookies === null ? request : request.set(COOKIE_HEADER, cookies);
}

export function postTicket(app: NestExpressApplication, cookies: string | null, body: object) {
  return withCookies(postApi(app, SUPPORT_ROUTES.BASE), cookies).send(body);
}

export function getTickets(
  app: NestExpressApplication,
  cookies: string | null,
  query: Record<string, string | number> = {},
) {
  return withCookies(getApi(app, SUPPORT_ROUTES.BASE).query(query), cookies);
}

export function getTicket(app: NestExpressApplication, cookies: string | null, ticketId: number) {
  return withCookies(getApi(app, ticketPath(SUPPORT_ROUTES.TICKET, ticketId)), cookies);
}

export function getTicketMessages(
  app: NestExpressApplication,
  cookies: string | null,
  ticketId: number,
  query: Record<string, string | number> = {},
) {
  return withCookies(
    getApi(app, ticketPath(SUPPORT_ROUTES.MESSAGES, ticketId)).query(query),
    cookies,
  );
}

export function postTicketMessage(
  app: NestExpressApplication,
  cookies: string | null,
  ticketId: number,
  text: string,
) {
  return withCookies(postApi(app, ticketPath(SUPPORT_ROUTES.MESSAGES, ticketId)), cookies).send({
    text,
  });
}

export function postTicketAction(
  app: NestExpressApplication,
  cookies: string | null,
  route: typeof SUPPORT_ROUTES.READ | typeof SUPPORT_ROUTES.CLOSE,
  ticketId: number,
) {
  return withCookies(postApi(app, ticketPath(route, ticketId)), cookies);
}
