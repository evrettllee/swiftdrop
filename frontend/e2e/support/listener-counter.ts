import type { Page } from '@playwright/test';

export type ListenerCounts = { listeners: number; intervals: number };

declare global {
  interface Window {
    swiftdropListeners?: () => ListenerCounts;
  }
}

function installListenerCounter(): void {
  const active = new Set<string>();
  const intervals = new Set<number>();
  const listenerIds = new WeakMap<EventListenerOrEventListenerObject, number>();
  let nextId = 0;

  function idOf(listener: EventListenerOrEventListenerObject | null): number {
    if (listener === null) {
      return 0;
    }

    const known = listenerIds.get(listener);

    if (known !== undefined) {
      return known;
    }

    nextId += 1;
    listenerIds.set(listener, nextId);

    return nextId;
  }

  function captureOf(options: boolean | EventListenerOptions | undefined): boolean {
    return typeof options === 'boolean' ? options : options?.capture === true;
  }

  function track(target: EventTarget, name: string): void {
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);

    target.addEventListener = (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) => {
      active.add(`${name}|${type}|${captureOf(options)}|${idOf(listener)}`);
      add(type, listener, options);
    };
    target.removeEventListener = (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ) => {
      active.delete(`${name}|${type}|${captureOf(options)}|${idOf(listener)}`);
      remove(type, listener, options);
    };
  }

  track(window, 'window');
  track(document, 'document');

  const startInterval = window.setInterval.bind(window);
  const stopInterval = window.clearInterval.bind(window);

  Object.defineProperty(window, 'setInterval', {
    configurable: true,
    value: (handler: TimerHandler, timeout?: number, ...rest: unknown[]): number => {
      const id = startInterval(handler, timeout, ...rest);
      intervals.add(id);

      return id;
    },
  });
  Object.defineProperty(window, 'clearInterval', {
    configurable: true,
    value: (id?: number): void => {
      if (id !== undefined) {
        intervals.delete(id);
      }

      stopInterval(id);
    },
  });

  window.swiftdropListeners = () => ({ listeners: active.size, intervals: intervals.size });
}

export async function countListeners(page: Page): Promise<void> {
  await page.addInitScript(installListenerCounter);
}

export function listenersOf(page: Page): Promise<ListenerCounts> {
  return page.evaluate(() => window.swiftdropListeners?.() ?? { listeners: -1, intervals: -1 });
}
