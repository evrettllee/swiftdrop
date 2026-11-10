import type { Page } from '@playwright/test';

type RenderCounts = Record<string, number>;

declare global {
  interface Window {
    swiftdropRenders?: RenderCounts;
  }
}

function installRenderCounter(): void {
  const PERFORMED_WORK = 1;
  const COUNTED_TAGS = new Set([0, 11, 15]);
  type Fiber = {
    tag: number;
    type: { displayName?: string; name?: string } | null;
    flags: number;
    child: Fiber | null;
    sibling: Fiber | null;
    alternate: Fiber | null;
  };
  const counts: RenderCounts = {};
  window.swiftdropRenders = counts;

  function count(fiber: Fiber): void {
    const name = fiber.type?.displayName ?? fiber.type?.name;

    if (COUNTED_TAGS.has(fiber.tag) && name !== undefined && name !== '') {
      counts[name] = (counts[name] ?? 0) + 1;
    }
  }

  function mount(fiber: Fiber | null): void {
    for (let child = fiber; child !== null; child = child.sibling) {
      count(child);
      mount(child.child);
    }
  }

  function update(next: Fiber, previous: Fiber): void {
    if ((next.flags & PERFORMED_WORK) === PERFORMED_WORK) {
      count(next);
    }

    if (next.child === previous.child) {
      return;
    }

    for (let child = next.child; child !== null; child = child.sibling) {
      if (child.alternate === null) {
        count(child);
        mount(child.child);
      } else {
        update(child, child.alternate);
      }
    }
  }

  Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
    configurable: true,
    value: {
      supportsFiber: true,
      renderers: new Map(),
      inject: () => 1,
      checkDCE: () => undefined,
      onScheduleFiberRoot: () => undefined,
      onCommitFiberUnmount: () => undefined,
      onPostCommitFiberRoot: () => undefined,
      onCommitFiberRoot: (_id: number, root: { current: Fiber }) => {
        const { current } = root;

        if (current.alternate === null) {
          mount(current.child);
        } else {
          update(current, current.alternate);
        }
      },
    },
  });
}

export async function countRenders(page: Page): Promise<void> {
  await page.addInitScript(installRenderCounter);
}

export async function resetRenders(page: Page): Promise<void> {
  await page.evaluate(() => {
    const counts = window.swiftdropRenders ?? {};

    for (const key of Object.keys(counts)) {
      delete counts[key];
    }
  });
}

export function rendersOf(page: Page, name: string): Promise<number> {
  return page.evaluate((component) => window.swiftdropRenders?.[component] ?? 0, name);
}
