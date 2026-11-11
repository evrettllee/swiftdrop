import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE, type RoleName } from '@/common/enums/role.enum';
import { FORBIDDEN_MESSAGE } from '../constants/access.constants';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

class UndecoratedController {
  open(): void {}

  @Public()
  publicRoute(): void {}

  @Roles(ROLE.ADMIN)
  adminRoute(): void {}

  @Roles(ROLE.MANAGER, ROLE.ADMIN)
  staffRoute(): void {}

  @Roles()
  emptyRoles(): void {}
}

@Roles(ROLE.COURIER)
class CourierController {
  inherited(): void {}

  @Roles(ROLE.CLIENT)
  overridden(): void {}

  @Public()
  publicRoute(): void {}
}

@Public()
class PublicController {
  open(): void {}
}

type ControllerClass = { prototype: object };

function context(
  controller: ControllerClass,
  handler: string,
  role?: RoleName,
  type = 'http',
): ExecutionContext {
  return {
    getType: () => type,
    getHandler: () => Reflect.get(controller.prototype, handler) as () => void,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ user: role === undefined ? undefined : { role } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const forbidden = new ForbiddenException(FORBIDDEN_MESSAGE);

  it('should refuse a signed-in user when neither the handler nor the class has metadata', () => {
    expect(() => guard.canActivate(context(UndecoratedController, 'open', ROLE.ADMIN))).toThrow(
      forbidden,
    );
  });

  it('should refuse an empty list of roles', () => {
    expect(() =>
      guard.canActivate(context(UndecoratedController, 'emptyRoles', ROLE.ADMIN)),
    ).toThrow(forbidden);
  });

  it('should let a public handler through without a user', () => {
    expect(guard.canActivate(context(UndecoratedController, 'publicRoute'))).toBe(true);
  });

  it('should let every handler of a public class through without a user', () => {
    expect(guard.canActivate(context(PublicController, 'open'))).toBe(true);
  });

  it('should let a public handler of a class with roles through without a user', () => {
    expect(guard.canActivate(context(CourierController, 'publicRoute'))).toBe(true);
  });

  it('should allow the user with the required role', () => {
    expect(guard.canActivate(context(UndecoratedController, 'adminRoute', ROLE.ADMIN))).toBe(true);
  });

  it('should allow the user with one of several allowed roles', () => {
    expect(guard.canActivate(context(UndecoratedController, 'staffRoute', ROLE.MANAGER))).toBe(
      true,
    );
  });

  it('should refuse the user with another role', () => {
    expect(() =>
      guard.canActivate(context(UndecoratedController, 'adminRoute', ROLE.CLIENT)),
    ).toThrow(forbidden);
  });

  it('should refuse when roles are required but there is no user', () => {
    expect(() => guard.canActivate(context(UndecoratedController, 'adminRoute'))).toThrow(
      forbidden,
    );
  });

  it('should take the roles of the class when the handler has none', () => {
    expect(guard.canActivate(context(CourierController, 'inherited', ROLE.COURIER))).toBe(true);
    expect(() => guard.canActivate(context(CourierController, 'inherited', ROLE.CLIENT))).toThrow(
      forbidden,
    );
  });

  it('should prefer the roles of the handler over those of the class', () => {
    expect(guard.canActivate(context(CourierController, 'overridden', ROLE.CLIENT))).toBe(true);
    expect(() => guard.canActivate(context(CourierController, 'overridden', ROLE.COURIER))).toThrow(
      forbidden,
    );
  });

  it('should leave socket messages to the gateway', () => {
    expect(guard.canActivate(context(UndecoratedController, 'open', undefined, 'ws'))).toBe(true);
  });
});
