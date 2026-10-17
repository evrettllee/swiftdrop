import { OSRM_PROFILE } from '../constants/osrm.constants';
import { routeGeometryKey } from './route-geometry-key';
import { TtlCache } from './ttl-cache';

const TTL_MS = 1000;
const MAX_ENTRIES = 2;
const START_MS = 5000;

describe('TtlCache', () => {
  let cache: TtlCache<string>;

  beforeEach(() => {
    cache = new TtlCache<string>(TTL_MS, MAX_ENTRIES);
  });

  it('should return a value until its time is up', () => {
    cache.set('a', 'first', START_MS);

    expect(cache.get('a', START_MS + TTL_MS - 1)).toBe('first');
    expect(cache.get('a', START_MS + TTL_MS)).toBeUndefined();
  });

  it('should drop an expired entry when it is read', () => {
    cache.set('a', 'first', START_MS);

    cache.get('a', START_MS + TTL_MS);

    expect(cache.size).toBe(0);
  });

  it('should return nothing for an unknown key', () => {
    expect(cache.get('missing', START_MS)).toBeUndefined();
  });

  it('should evict the oldest entry beyond the limit', () => {
    cache.set('a', 'first', START_MS);
    cache.set('b', 'second', START_MS);
    cache.set('c', 'third', START_MS);

    expect(cache.size).toBe(MAX_ENTRIES);
    expect(cache.get('a', START_MS)).toBeUndefined();
    expect(cache.get('b', START_MS)).toBe('second');
    expect(cache.get('c', START_MS)).toBe('third');
  });

  it('should keep a rewritten entry as the newest one', () => {
    cache.set('a', 'first', START_MS);
    cache.set('b', 'second', START_MS);
    cache.set('a', 'again', START_MS);
    cache.set('c', 'third', START_MS);

    expect(cache.get('a', START_MS)).toBe('again');
    expect(cache.get('b', START_MS)).toBeUndefined();
  });

  it('should restart the time of a rewritten entry', () => {
    cache.set('a', 'first', START_MS);
    cache.set('a', 'again', START_MS + TTL_MS - 1);

    expect(cache.get('a', START_MS + TTL_MS)).toBe('again');
  });
});

describe('routeGeometryKey', () => {
  const FROM = { latitude: 53.90061, longitude: 27.55904 };
  const TO = { latitude: 53.9075, longitude: 27.457 };

  it('should round the points to four digits after the point', () => {
    expect(routeGeometryKey(OSRM_PROFILE.CAR, [FROM, TO])).toBe(
      'car|53.9006,27.5590;53.9075,27.4570',
    );
  });

  it('should give points a few meters apart the same key', () => {
    const near = { latitude: 53.90064, longitude: 27.55896 };

    expect(routeGeometryKey(OSRM_PROFILE.CAR, [near, TO])).toBe(
      routeGeometryKey(OSRM_PROFILE.CAR, [FROM, TO]),
    );
  });

  it('should tell the profiles and the order of the points apart', () => {
    const car = routeGeometryKey(OSRM_PROFILE.CAR, [FROM, TO]);

    expect(routeGeometryKey(OSRM_PROFILE.FOOT, [FROM, TO])).not.toBe(car);
    expect(routeGeometryKey(OSRM_PROFILE.CAR, [TO, FROM])).not.toBe(car);
  });
});
