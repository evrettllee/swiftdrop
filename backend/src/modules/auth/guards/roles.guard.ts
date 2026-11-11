import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HTTP_CONTEXT_TYPE } from '@/common/constants/http.constants';
import type { RoleName } from '@/common/enums/role.enum';
import { FORBIDDEN_MESSAGE, IS_PUBLIC_KEY, ROLES_KEY } from '../constants/access.constants';
import type { AuthUser } from '../types/auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== HTTP_CONTEXT_TYPE || this.isPublic(context)) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<RoleName[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const isAllowed =
      requiredRoles !== undefined && user !== undefined && requiredRoles.includes(user.role);

    if (!isAllowed) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }

    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }
}
