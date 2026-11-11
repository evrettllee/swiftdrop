import type { z } from 'zod';

export type ListParamValue = string | number | boolean | null | readonly string[];

export type ListParamValues = Record<string, ListParamValue>;

type KeysOf<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T] & string;

export type ListParamsConfig<T extends ListParamValues> = {
  schema: { shape: { [K in keyof T]: z.ZodType<T[K]> } };
  defaults: T;
  pageKey?: KeysOf<T, number>;
  searchKey?: KeysOf<T, string | null>;
};

export const LIST_PARAM_TRUE = 'true';
export const LIST_PARAM_SEPARATOR = ',';

function keysOf<T extends ListParamValues>(config: ListParamsConfig<T>): (keyof T & string)[] {
  return Object.keys(config.defaults);
}

export function serializeListParam(value: ListParamValue): string | null {
  if (value === null || value === false || value === '') {
    return null;
  }

  if (value === true) {
    return LIST_PARAM_TRUE;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.length === 0 ? null : value.join(LIST_PARAM_SEPARATOR);
}

export function readListParams<T extends ListParamValues>(
  search: URLSearchParams,
  config: ListParamsConfig<T>,
): T {
  const values = { ...config.defaults };

  for (const key of keysOf(config)) {
    const raw = search.get(key);

    if (raw !== null) {
      const parsed = config.schema.shape[key].safeParse(raw);

      if (parsed.success) {
        values[key] = parsed.data;
      }
    }
  }

  return values;
}

export function writeListParams<T extends ListParamValues>(
  base: URLSearchParams,
  values: T,
  config: ListParamsConfig<T>,
): URLSearchParams {
  const next = new URLSearchParams(base);

  for (const key of keysOf(config)) {
    const serialized = serializeListParam(values[key]);
    next.delete(key);

    if (serialized !== null && serialized !== serializeListParam(config.defaults[key])) {
      next.set(key, serialized);
    }
  }

  return next;
}

export function applyListPatch<T extends ListParamValues>(
  values: T,
  patch: Partial<T>,
  config: ListParamsConfig<T>,
): T {
  const next: T = { ...values, ...patch };
  const { pageKey } = config;

  if (pageKey !== undefined && !Object.hasOwn(patch, pageKey)) {
    next[pageKey] = config.defaults[pageKey];
  }

  return next;
}

export function listParamsKey<T extends ListParamValues>(
  values: T,
  config: ListParamsConfig<T>,
): string {
  return keysOf(config)
    .filter((key) => key !== config.pageKey)
    .map((key) => `${key}=${serializeListParam(values[key]) ?? ''}`)
    .join('&');
}

export type ListUntil = { key: string; until: number };

export function untilForKey(state: ListUntil | null, key: string): number | null {
  return state !== null && state.key === key ? state.until : null;
}
