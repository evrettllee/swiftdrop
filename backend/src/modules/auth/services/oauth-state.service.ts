import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { OAuthProvider } from '../../../common/enums/oauth-provider.enum';
import { AuthCookiesService } from './auth-cookies.service';
import { OAUTH_STATE_BYTES, OAUTH_STATE_ENCODING } from '../constants/oauth.constants';

@Injectable()
export class OAuthStateService {
  constructor(private readonly authCookiesService: AuthCookiesService) {}

  issue(response: Response, provider: OAuthProvider): string {
    const state = randomBytes(OAUTH_STATE_BYTES).toString(OAUTH_STATE_ENCODING);
    this.authCookiesService.setOAuthState(response, provider, state);

    return state;
  }

  // The cookie is single-use: it is cleared whether or not the check passes.
  verify(request: Request, response: Response, provider: OAuthProvider): boolean {
    const expected = this.authCookiesService.getOAuthState(request, provider);
    const received = request.query.state;
    this.authCookiesService.clearOAuthState(response, provider);

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
