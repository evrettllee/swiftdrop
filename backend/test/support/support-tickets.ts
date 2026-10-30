import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  SUPPORT_ROUTES,
  TICKET_ID_ROUTE_PARAM,
} from '@/modules/support/constants/support.constants';
import { SUPPORT_STAFF_ROUTES } from '@/modules/support/constants/support-staff.constants';
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

function staffPath(route: string, ticketId?: number): string {
  const path =
    ticketId === undefined ? route : route.replace(TICKET_ID_ROUTE_PARAM, String(ticketId));

  return `${SUPPORT_STAFF_ROUTES.BASE}/${path}`;
}

export function getStaffTickets(
  app: NestExpressApplication,
  cookies: string | null,
  query: Record<string, string | number> = {},
) {
  return withCookies(getApi(app, staffPath(SUPPORT_STAFF_ROUTES.TICKETS)).query(query), cookies);
}

export function getStaffCounts(app: NestExpressApplication, cookies: string | null) {
  return withCookies(getApi(app, staffPath(SUPPORT_STAFF_ROUTES.COUNTS)), cookies);
}

export function getStaffTicket(
  app: NestExpressApplication,
  cookies: string | null,
  ticketId: number,
) {
  return withCookies(getApi(app, staffPath(SUPPORT_STAFF_ROUTES.TICKET, ticketId)), cookies);
}

export function getStaffMessages(
  app: NestExpressApplication,
  cookies: string | null,
  ticketId: number,
) {
  return withCookies(getApi(app, staffPath(SUPPORT_STAFF_ROUTES.MESSAGES, ticketId)), cookies);
}

export function postStaffMessage(
  app: NestExpressApplication,
  cookies: string | null,
  ticketId: number,
  text: string,
) {
  return withCookies(
    postApi(app, staffPath(SUPPORT_STAFF_ROUTES.MESSAGES, ticketId)),
    cookies,
  ).send({ text });
}

export function postStaffAction(
  app: NestExpressApplication,
  cookies: string | null,
  route: typeof SUPPORT_STAFF_ROUTES.READ | typeof SUPPORT_STAFF_ROUTES.CLOSE,
  ticketId: number,
) {
  return withCookies(postApi(app, staffPath(route, ticketId)), cookies);
}
