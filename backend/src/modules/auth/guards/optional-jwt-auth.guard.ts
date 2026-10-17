import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_STRATEGY_NAME } from '../constants/access.constants';

// For a public route that treats a signed-in user differently from a guest: a valid session sets
// the user, anything else (no session, an expired or a broken one) leaves a guest, never a refusal.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard(JWT_STRATEGY_NAME) {
  handleRequest<TUser>(_error: unknown, user: TUser | false): TUser {
    // Passport passes false for a guest; the request gets null as its user then.
    return (user === false ? null : user) as TUser;
  }
}
