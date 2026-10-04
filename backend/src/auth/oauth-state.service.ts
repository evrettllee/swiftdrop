import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthCookiesService } from './auth-cookies.service';
import { OAUTH_STATE_BYTES, OAUTH_STATE_ENCODING } from './oauth.constants';

@Injectable()
export class OAuthStateService {
  constructor(private readonly authCookiesService: AuthCookiesService) {}

  issue(response: Response): string {
    const state = randomBytes(OAUTH_STATE_BYTES).toString(OAUTH_STATE_ENCODING);
    this.authCookiesService.setOAuthState(response, state);

    return state;
  }

  // The cookie is single-use: it is cleared whether or not the check passes.
  verify(request: Request, response: Response): boolean {
    const expected = this.authCookiesService.getOAuthState(request);
    const received = request.query.state;
    this.authCookiesService.clearOAuthState(response);

    return (
      expected !== undefined && typeof received === 'string' && this.areEqual(expected, received)
    );
  }

  private areEqual(first: string, second: string): boolean {
    const left = Buffer.from(first);
    const right = Buffer.from(second);

    return left.length === right.length && timingSafeEqual(left, right);
  }
}
