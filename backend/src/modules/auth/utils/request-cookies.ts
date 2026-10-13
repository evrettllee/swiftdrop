import type { Request } from 'express';

// A plain function, so the JWT strategy can use it before `this` exists in its constructor.
export function readCookie(request: Request, name: string): string | undefined {
  const value: unknown = request.cookies?.[name];

  return typeof value === 'string' ? value : undefined;
}
