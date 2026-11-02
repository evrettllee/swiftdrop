import type { Page, Route } from '@playwright/test';
import { ADDRESS_NAME_SEPARATOR } from '../../src/pages/order/config/repeat-order';
import {
  GEOCODING_BASE_URL,
  GEOCODING_PATHS,
} from '../../src/shared/api/endpoints/geocoding/geocoding-params';
import { MAPBOX_API_ORIGIN } from '../../src/shared/config/map';

export type TestAddress = {
  street: string;
  house: string;
  latitude: number;
  longitude: number;
};

const CITY = 'Минск';
const PLACE_FORMATTED = `${CITY}, Беларусь`;

// Two addresses inside the service zone of Minsk.
export const TEST_ADDRESSES = {
  SVERDLOVA: { street: 'улица Свердлова', house: '13а', latitude: 53.8945, longitude: 27.5486 },
  PRITYTSKOGO: {
    street: 'проспект Притыцкого',
    house: '83',
    latitude: 53.9066,
    longitude: 27.4565,
  },
} as const satisfies Record<string, TestAddress>;

const ALL_ADDRESSES: TestAddress[] = Object.values(TEST_ADDRESSES);

// The text of the address field once a suggestion is chosen, and again in a repeated order.
export function addressName(address: TestAddress): string {
  return [address.street, address.house].join(ADDRESS_NAME_SEPARATOR);
}

// One feature of the Mapbox Geocoding v6 response, with the parts the app reads.
function toFeature(address: TestAddress) {
  return {
    type: 'Feature',
    properties: {
      mapbox_id: `e2e.${address.latitude},${address.longitude}`,
      name: addressName(address),
      place_formatted: PLACE_FORMATTED,
      coordinates: { latitude: address.latitude, longitude: address.longitude },
      context: {
        address: { address_number: address.house, street_name: address.street },
        street: { name: address.street },
        place: { name: CITY },
      },
    },
  };
}

const QUERY_PARAM = 'q';
// The app fetches from its own origin, so the answer must allow it.
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };
// A 1×1 transparent PNG: every map tile.
const EMPTY_TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const PNG_CONTENT_TYPE = 'image/png';

function fulfillFeatures(route: Route, addresses: TestAddress[]): Promise<void> {
  return route.fulfill({
    headers: CORS_HEADERS,
    json: { type: 'FeatureCollection', features: addresses.map(toFeature) },
  });
}

// Answers every request to Mapbox: the forward search finds the test addresses whose name holds
// the typed text, the reverse search returns the first test address, and a tile is empty.
export async function stubMapbox(page: Page): Promise<void> {
  await page.route(`${MAPBOX_API_ORIGIN}/**`, (route) => {
    const url = new URL(route.request().url());
    const endpoint = `${url.origin}${url.pathname}`;

    if (endpoint === `${GEOCODING_BASE_URL}${GEOCODING_PATHS.FORWARD}`) {
      const query = (url.searchParams.get(QUERY_PARAM) ?? '').toLocaleLowerCase();

      return fulfillFeatures(
        route,
        ALL_ADDRESSES.filter((address) => addressName(address).toLocaleLowerCase().includes(query)),
      );
    }

    if (endpoint === `${GEOCODING_BASE_URL}${GEOCODING_PATHS.REVERSE}`) {
      return fulfillFeatures(route, ALL_ADDRESSES.slice(0, 1));
    }

    return route.fulfill({
      headers: CORS_HEADERS,
      contentType: PNG_CONTENT_TYPE,
      body: EMPTY_TILE,
    });
  });
}
