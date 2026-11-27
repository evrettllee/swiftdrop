import { ServerResponse } from 'node:http';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import express, { type NextFunction, type Request, type Response } from 'express';
import { configureApp, setSecurityHeaders } from './app.setup';
import { SECURITY_RESPONSE_HEADERS, X_POWERED_BY_SETTING } from './common/constants/http.constants';

describe('configureApp', () => {
  it('should disable x-powered-by and register security header middleware', async () => {
    const moduleRef = await Test.createTestingModule({}).compile();
    const app = moduleRef.createNestApplication<NestExpressApplication>();
    const disableSpy = jest.spyOn(app, 'disable');
    const useSpy = jest.spyOn(app, 'use');

    try {
      configureApp(app);
      await app.init();

      expect(disableSpy).toHaveBeenCalledWith(X_POWERED_BY_SETTING);
      expect(useSpy).toHaveBeenCalledWith(setSecurityHeaders);
    } finally {
      await app.close();
    }
  });

  it('should keep x-powered-by disabled on the express instance', () => {
    const instance = express();
    const app = {
      disable: instance.disable.bind(instance),
      use: instance.use.bind(instance),
      setGlobalPrefix: jest.fn(),
      useBodyParser: jest.fn(),
    } as unknown as NestExpressApplication;

    configureApp(app);

    expect(instance.enabled(X_POWERED_BY_SETTING)).toBe(false);
  });

  it('should attach security headers in setSecurityHeaders', () => {
    const req = {} as Request;
    const res = new ServerResponse(req);
    const next: NextFunction = jest.fn();

    setSecurityHeaders(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(1);

    for (const [name, expected] of SECURITY_RESPONSE_HEADERS) {
      expect(res.getHeader(name)).toBe(expected);
    }
  });
});
