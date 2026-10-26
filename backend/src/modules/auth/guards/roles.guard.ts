import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleName } from '@/common/enums/role.enum';
import { FORBIDDEN_MESSAGE, ROLES_KEY } from '../constants/access.constants';
import type { AuthUser } from '../types/auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const isAllowed =
      requiredRoles === undefined || (user !== undefined && requiredRoles.includes(user.role));

    if (!isAllowed) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }

    return true;
  }
}
