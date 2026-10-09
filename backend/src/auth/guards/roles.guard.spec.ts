import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { FORBIDDEN_MESSAGE } from '../constants/access.constants';
import { ROLE, type RoleName } from '../../common/enums/role.enum';
import { RolesGuard } from './roles.guard';

function createGuard(requiredRoles: RoleName[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  } as unknown as Reflector;

  return new RolesGuard(reflector);
}

function createContext(role?: RoleName): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: role === undefined ? undefined : { role } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('should allow the request when no roles are required', () => {
    expect(createGuard(undefined).canActivate(createContext())).toBe(true);
  });

  it('should allow the request when the user has the required role', () => {
    expect(createGuard([ROLE.ADMIN]).canActivate(createContext(ROLE.ADMIN))).toBe(true);
  });

  it('should allow the request when the user has one of several allowed roles', () => {
    const guard = createGuard([ROLE.MANAGER, ROLE.ADMIN]);

    expect(guard.canActivate(createContext(ROLE.MANAGER))).toBe(true);
  });

  it('should throw forbidden when the user has a different role', () => {
    const guard = createGuard([ROLE.ADMIN]);

    expect(() => guard.canActivate(createContext(ROLE.CLIENT))).toThrow(
      new ForbiddenException(FORBIDDEN_MESSAGE),
    );
  });

  it('should throw forbidden when roles are required but there is no user', () => {
    expect(() => createGuard([ROLE.ADMIN]).canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });
});
