import { expect, type Page, test, type WebSocketRoute } from '@playwright/test';
import { OFFER_NOTICE } from '../src/features/order-offer/config/offer';
import { OFFER_NOTICE_TEXTS, OFFER_TEXTS } from '../src/features/order-offer/config/texts';
import { COURIER_OFFERS_API_PATHS } from '../src/shared/api/endpoints/courier-offer';
import { HTTP_STATUS } from '../src/shared/api/request-config';
import { COURIER_SOCKET_EVENTS } from '../src/shared/realtime/courier-events';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { CITY_CENTER } from '../src/shared/config/map';
import { MAP_CLASS, MAP_TEXTS } from '../src/shared/ui/route-map/map';
import { requireCourier, signInAsCourier, stubCourierOnLine } from './support/courier';
import { waitForPath } from './support/courier-pages';
import { stubMapbox } from './support/mapbox';
import {
  buildTestOffer,
  interceptCourierSocket,
  sendCourierEvent,
  stubCurrentOffer,
  stubOfferAnswer,
} from './support/offers';

// The offers come from the stubbed API and socket: no order and no dispatcher are needed, and the
// courier is not changed. One page signed in once serves all the tests: the sign-in of the backend
// is rate-limited.
test.describe.configure({ mode: 'serial' });

const OFFER_ID = 990001;
const TIMER_PATTERN = /^0:[0-3]\d$/;

let page: Page;
let getSocket: () => WebSocketRoute | null;

function offerWindow() {
  return page.getByRole('dialog', { name: OFFER_TEXTS.TITLE });
}

function takenNotice() {
  return page.getByRole('status').filter({ hasText: OFFER_NOTICE_TEXTS[OFFER_NOTICE.TAKEN].title });
}

test.beforeAll(async ({ browser }) => {
  requireCourier();
  page = await browser.newPage();
  getSocket = await interceptCourierSocket(page);
  await signInAsCourier(page);
  await waitForPath(page, APP_ROUTES.COURIER_WORK);
});

test.afterAll(async () => {
  await page.close();
});

// Every test opens the cabinet again with the offer open and the answers it sets.
test.beforeEach(async () => {
  await page.unrouteAll();
  await stubMapbox(page);
  await stubCurrentOffer(page, buildTestOffer(OFFER_ID));
});

async function openCabinet(): Promise<void> {
  await page.reload();
  await expect(offerWindow()).toBeVisible();
}

test('should show the current offer with its timer and addresses when the cabinet opens', async () => {
  await openCabinet();
  const window = offerWindow();

  await expect(window.getByText(TIMER_PATTERN)).toBeVisible();
  await expect(window.getByRole('progressbar', { name: OFFER_TEXTS.TIME_LEFT })).toBeVisible();
  await expect(window.getByText('улица Свердлова, 13а, Минск')).toBeVisible();
  await expect(window.getByText('проспект Притыцкого, Минск')).toBeVisible();
  await expect(window.getByText(OFFER_TEXTS.DELIVERY_HINT)).toBeVisible();
  await expect(window.getByRole('button', { name: OFFER_TEXTS.ACCEPT })).toBeFocused();
});

test('should keep the offer open when the courier presses Escape', async () => {
  await openCabinet();

  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');

  await expect(offerWindow()).toBeVisible();
});

test('should put the map of the offer in the full screen and back when the courier presses the button', async () => {
  await openCabinet();
  const map = offerWindow().getByRole('region', { name: MAP_TEXTS.AREA_LABEL });
  const isMapFullscreen = () => map.evaluate((element) => document.fullscreenElement === element);

  await map.getByRole('button', { name: MAP_TEXTS.FULLSCREEN }).click();

  await expect.poll(isMapFullscreen).toBe(true);
  const exitButton = map.getByRole('button', { name: MAP_TEXTS.EXIT_FULLSCREEN });
  await expect(exitButton).toHaveAttribute('aria-pressed', 'true');

  await exitButton.click();

  await expect.poll(isMapFullscreen).toBe(false);
  await expect(map.getByRole('button', { name: MAP_TEXTS.FULLSCREEN })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('should show the courier on the map of the offer when their position is known', async () => {
  const [latitude, longitude] = CITY_CENTER;
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude, longitude });
  await stubCourierOnLine(page);
  await openCabinet();

  const map = offerWindow().getByRole('region', { name: MAP_TEXTS.AREA_LABEL });

  await expect(map.locator(`.${MAP_CLASS.POSITION}`)).toBeVisible();
  await expect(map.getByRole('button', { name: MAP_TEXTS.LOCATE })).toBeVisible();
});

test('should close the offer when the courier declines it', async () => {
  await stubOfferAnswer(page, COURIER_OFFERS_API_PATHS.decline(OFFER_ID), HTTP_STATUS.NO_CONTENT);
  await openCabinet();

  await offerWindow().getByRole('button', { name: OFFER_TEXTS.DECLINE }).click();

  await expect(offerWindow()).toBeHidden();
});

test('should tell the order is unavailable when it was taken before the courier accepted it', async () => {
  await stubOfferAnswer(page, COURIER_OFFERS_API_PATHS.accept(OFFER_ID), HTTP_STATUS.CONFLICT, {
    message: 'Заказ уже недоступен',
  });
  await openCabinet();

  await offerWindow().getByRole('button', { name: OFFER_TEXTS.ACCEPT }).click();

  await expect(offerWindow()).toBeHidden();
  await expect(takenNotice()).toBeVisible();
});

test('should close the offer when the backend closes it over the socket', async () => {
  await openCabinet();
  const socket = getSocket();

  if (socket === null) {
    throw new Error('The cabinet opened no socket');
  }

  sendCourierEvent(socket, COURIER_SOCKET_EVENTS.OFFER_CLOSED, { offerId: OFFER_ID });

  await expect(offerWindow()).toBeHidden();
  await expect(takenNotice()).toBeVisible();
});
