import type { NestExpressApplication } from '@nestjs/platform-express';
import { MANAGER_ASSIGNMENT_ROUTES } from '@/modules/manager/constants/manager-assignment.constants';
import { MANAGER_CANCEL_ROUTE } from '@/modules/manager/constants/manager-cancellation.constants';
import { COOKIE_HEADER } from './auth';
import { getApi, postApi } from './http';
import { managerOrderPath } from './manager';

export function getCandidates(
  app: NestExpressApplication,
  cookies: string | null,
  orderId: number,
  query: Record<string, string> = {},
) {
  const candidatesRequest = getApi(
    app,
    managerOrderPath(MANAGER_ASSIGNMENT_ROUTES.CANDIDATES, orderId),
  ).query(query);

  return cookies === null ? candidatesRequest : candidatesRequest.set(COOKIE_HEADER, cookies);
}

export function postAssign(
  app: NestExpressApplication,
  cookies: string | null,
  orderId: number,
  courierId: number,
) {
  const assignRequest = postApi(
    app,
    managerOrderPath(MANAGER_ASSIGNMENT_ROUTES.ASSIGN, orderId),
  ).send({
    courierId,
  });

  return cookies === null ? assignRequest : assignRequest.set(COOKIE_HEADER, cookies);
}

export function postReassign(
  app: NestExpressApplication,
  cookies: string | null,
  orderId: number,
  body: object,
) {
  const request = postApi(app, managerOrderPath(MANAGER_ASSIGNMENT_ROUTES.REASSIGN, orderId)).send(
    body,
  );

  return cookies === null ? request : request.set(COOKIE_HEADER, cookies);
}

export function postRestartAssignment(
  app: NestExpressApplication,
  cookies: string | null,
  orderId: number,
  body: object,
) {
  const path = managerOrderPath(MANAGER_ASSIGNMENT_ROUTES.RESTART_ASSIGNMENT, orderId);
  const request = postApi(app, path).send(body);

  return cookies === null ? request : request.set(COOKIE_HEADER, cookies);
}

export function postManagerCancel(
  app: NestExpressApplication,
  cookies: string | null,
  orderId: number,
  body: object,
) {
  const request = postApi(app, managerOrderPath(MANAGER_CANCEL_ROUTE, orderId)).send(body);

  return cookies === null ? request : request.set(COOKIE_HEADER, cookies);
}
