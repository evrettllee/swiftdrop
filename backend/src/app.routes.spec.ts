import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, MODULE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { IS_PUBLIC_KEY, ROLES_KEY } from '@/modules/auth/constants/access.constants';

type ControllerClass = { name: string; prototype: object };

const SOURCE_ROOT = __dirname;
const APP_MODULE_FILE = 'app.module.ts';
const MODULE_FILE_SUFFIX = '.module.ts';
const MIN_EXPECTED_CONTROLLERS = 10;

function moduleFiles(): string[] {
  return readdirSync(SOURCE_ROOT, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith(MODULE_FILE_SUFFIX) && file !== APP_MODULE_FILE)
    .map((file) => join(SOURCE_ROOT, file));
}

async function registeredControllers(): Promise<Set<ControllerClass>> {
  const controllers = new Set<ControllerClass>();

  for (const file of moduleFiles()) {
    const exported = (await import(file)) as Record<string, unknown>;

    for (const value of Object.values(exported).filter((item) => typeof item === 'function')) {
      const listed: unknown = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, value);

      if (Array.isArray(listed)) {
        listed.forEach((controller: ControllerClass) => controllers.add(controller));
      }
    }
  }

  return controllers;
}

function pathOf(target: object): string {
  const path: unknown = Reflect.getMetadata(PATH_METADATA, target);

  return [path].flat().join(',');
}

function hasAccessMetadata(target: object): boolean {
  return (
    Reflect.getMetadata(IS_PUBLIC_KEY, target) === true ||
    Reflect.getMetadata(ROLES_KEY, target) !== undefined
  );
}

function routesWithoutAccess(controller: ControllerClass): string[] {
  const { prototype } = controller;
  const classHasAccess = hasAccessMetadata(controller);

  return Object.getOwnPropertyNames(prototype)
    .map((name) => ({ name, handler: Reflect.get(prototype, name) as unknown }))
    .filter(
      (entry): entry is { name: string; handler: object } =>
        typeof entry.handler === 'function' &&
        Reflect.getMetadata(METHOD_METADATA, entry.handler) !== undefined,
    )
    .filter(({ handler }) => !classHasAccess && !hasAccessMetadata(handler))
    .map(({ name, handler }) => {
      const method = RequestMethod[Reflect.getMetadata(METHOD_METADATA, handler) as number];

      return `${method} /${pathOf(controller)}/${pathOf(handler)} (${controller.name}.${name})`;
    });
}

describe('Route access', () => {
  let controllers: Set<ControllerClass>;

  beforeAll(async () => {
    controllers = await registeredControllers();
  });

  it('should find the controllers of every module', () => {
    expect(controllers.size).toBeGreaterThanOrEqual(MIN_EXPECTED_CONTROLLERS);
  });

  it('should mark every route with @Public or @Roles on the handler or its class', () => {
    const unmarked = [...controllers].flatMap(routesWithoutAccess);

    expect(unmarked).toEqual([]);
  });
});
