import { VEHICLE_TYPE } from '../../../common/enums/vehicle-type.enum';
import { OSRM_PROFILE } from '../../../integrations/osrm/constants/osrm.constants';
import { COURIER_LOCATION_FRESH_MS } from '../../assignment/constants/assignment.constants';
import { toRoutingCourier } from './routing-courier';

const NOW = new Date('2026-10-16T12:00:00Z');
const row = {
  currentLat: 53.92,
  currentLng: 27.6,
  locationUpdatedAt: new Date(NOW.getTime() - 1000),
  vehicleType: VEHICLE_TYPE.BICYCLE,
};

describe('toRoutingCourier', () => {
  it('should take a fresh position and the profile of the vehicle', () => {
    expect(toRoutingCourier(row, NOW)).toEqual({
      position: { latitude: 53.92, longitude: 27.6 },
      profile: OSRM_PROFILE.BIKE,
    });
  });

  it('should still take a position exactly as old as the limit', () => {
    const atLimit = {
      ...row,
      locationUpdatedAt: new Date(NOW.getTime() - COURIER_LOCATION_FRESH_MS),
    };

    expect(toRoutingCourier(atLimit, NOW).position).not.toBeNull();
  });

  it('should drop a position older than the limit', () => {
    const stale = {
      ...row,
      locationUpdatedAt: new Date(NOW.getTime() - COURIER_LOCATION_FRESH_MS - 1),
    };

    expect(toRoutingCourier(stale, NOW).position).toBeNull();
  });

  it('should have no position before the first one', () => {
    const empty = { ...row, currentLat: null, currentLng: null, locationUpdatedAt: null };

    expect(toRoutingCourier(empty, NOW).position).toBeNull();
  });

  it('should go by car without a vehicle or a courier', () => {
    expect(toRoutingCourier({ ...row, vehicleType: null }, NOW).profile).toBe(OSRM_PROFILE.CAR);
    expect(toRoutingCourier(undefined, NOW)).toEqual({ position: null, profile: OSRM_PROFILE.CAR });
  });
});
