import { UNKNOWN_FAILURE_CODE } from '@/modules/service-failures/constants/service-failures.constants';
import { safeCode } from '@/modules/service-failures/utils/failure-message';

export const NO_ROUTE_TEMPLATE = '(no route)';

export type FailedRequest = { method?: unknown; route?: unknown; originalUrl?: unknown };

function routeTemplateOf(request: FailedRequest): string {
  const route = request.route;
  const path =
    typeof route === 'object' && route !== null && 'path' in route ? route.path : undefined;

  return typeof path === 'string' ? path : NO_ROUTE_TEMPLATE;
}

function errorClassOf(exception: unknown): string {
  return (
    (exception instanceof Error ? safeCode(exception.constructor.name) : null) ??
    UNKNOWN_FAILURE_CODE
  );
}

export function serverFailureMessage(request: FailedRequest, exception: unknown): string {
  const method = safeCode(request.method) ?? UNKNOWN_FAILURE_CODE;

  return `${method} ${routeTemplateOf(request)}: ${errorClassOf(exception)}`;
}
