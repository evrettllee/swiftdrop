import { expect, type Page, test } from '@playwright/test';
import { PROGRESS_STEPS, PROGRESS_STOP_LABELS } from '../src/pages/order/config/progress';
import { ORDER_DETAILS_TEXTS } from '../src/pages/order/config/texts';
import { ORDER_STATUS, type OrderStatus } from '../src/shared/api/endpoints/order';
import { openLiveOrder, stubLiveOrder } from './support/live-order';

const TIME = '\\d{2}:\\d{2}';

function progressSteps(page: Page) {
  return page
    .getByRole('region', { name: ORDER_DETAILS_TEXTS.SECTION_PROGRESS, exact: true })
    .getByRole('listitem');
}

function passed(label: string): RegExp {
  return new RegExp(`^${label}${TIME}$`);
}

function ahead(label: string): RegExp {
  return new RegExp(`^${label}$`);
}

function expectedSteps(current: number): RegExp[] {
  return PROGRESS_STEPS.map((step, index) =>
    index <= current ? passed(step.label) : ahead(step.label),
  );
}

const DELIVERY_CASES: readonly { status: OrderStatus; current: number }[] = [
  { status: ORDER_STATUS.PENDING, current: 0 },
  { status: ORDER_STATUS.COURIER_ASSIGNED, current: 2 },
  { status: ORDER_STATUS.IN_TRANSIT, current: 4 },
  { status: ORDER_STATUS.DELIVERED, current: 5 },
];

for (const { status, current } of DELIVERY_CASES) {
  test(`should mark the step reached at ${status} as current, with the time only on the passed ones`, async ({
    page,
  }) => {
    const order = await stubLiveOrder(page);
    order.status = status;
    await openLiveOrder(page, order);

    const steps = progressSteps(page);

    await expect(steps).toHaveText(expectedSteps(current));
    await expect(steps.and(page.locator('[aria-current]'))).toHaveCount(1);
    await expect(steps.nth(current)).toHaveAttribute('aria-current', 'step');
  });
}

test('should end the steps of a cancelled order with the cancellation as the current step', async ({
  page,
}) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.CANCELLED;
  await openLiveOrder(page, order);

  const steps = progressSteps(page);
  const cancelled = PROGRESS_STOP_LABELS[ORDER_STATUS.CANCELLED] ?? '';

  await expect(steps).toHaveText([
    passed(PROGRESS_STEPS[0].label),
    passed(PROGRESS_STEPS[1].label),
    passed(cancelled),
  ]);
  await expect(steps.and(page.locator('[aria-current]'))).toHaveCount(1);
  await expect(steps.last()).toHaveAttribute('aria-current', 'step');
});

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 375, height: 812 },
] as const;
const EDGE_TOLERANCE = 0.5;

for (const viewport of VIEWPORTS) {
  for (const status of [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED]) {
    test(`should line up the right edges of the times at ${status} on ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      const order = await stubLiveOrder(page);
      order.status = status;
      await openLiveOrder(page, order);

      const times = progressSteps(page).getByText(new RegExp(`^${TIME}$`));
      await expect(times).toHaveCount(
        status === ORDER_STATUS.DELIVERED ? PROGRESS_STEPS.length : 3,
      );
      const rights = await times.evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().right),
      );

      expect(Math.max(...rights) - Math.min(...rights)).toBeLessThanOrEqual(EDGE_TOLERANCE);
    });
  }
}
