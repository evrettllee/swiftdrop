export const MINSK_PICKUP = { latitude: 53.9006, longitude: 27.559 };
export const MINSK_DELIVERY = { latitude: 53.9075, longitude: 27.457 };
export const MOSCOW = { latitude: 55.75, longitude: 37.61 };
export const SMALL_PACKAGE = {
  weightKg: 2.5,
  lengthCm: 30,
  widthCm: 20,
  heightCm: 10,
  isFragile: false,
};
// 704.8 seconds is 12 minutes after rounding up, plus the 10 minute pickup buffer.
export const ROUTE = { distanceKm: 7.98, durationSec: 704.8 };

// A valid order body for the test service area, its price is 9.23 BYN with ROUTE.
export const VALID_ORDER = {
  pickup: { ...MINSK_PICKUP, city: 'Минск', street: 'ул. Свердлова', house: '13а' },
  delivery: {
    ...MINSK_DELIVERY,
    city: 'Минск',
    street: 'пр-т Притыцкого',
    house: '83',
    apartment: '47',
  },
  recipient: { name: 'Ирина Козлова', phone: '+375 29 123-45-67' },
  package: SMALL_PACKAGE,
};
