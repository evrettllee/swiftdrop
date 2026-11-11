import type { CourierCandidateRow, CourierChecks } from '../types/manager-assignment.types';
import { toCandidateView, toUnsuitableView, unsuitableReasons } from './courier-candidate.mapper';

const ALL_PASS: CourierChecks = {
  onShift: true,
  freshLocation: true,
  free: true,
  hasVehicle: true,
  vehicleFits: true,
};

const ROW: CourierCandidateRow = {
  ...ALL_PASS,
  courierId: 3,
  firstName: 'Дмитрий',
  lastName: 'Соколов',
  vehicleType: 'car',
  pickupDistanceM: 1240,
  positionAgeMs: 45_900,
  hasOpenOffer: true,
};

describe('unsuitableReasons', () => {
  it('should find no reason for a courier who fits', () => {
    expect(unsuitableReasons(ALL_PASS)).toEqual([]);
  });

  it.each([
    [{ onShift: false }, ['offline']],
    [{ freshLocation: false }, ['stale_location']],
    [{ free: false }, ['busy']],
    [{ vehicleFits: false }, ['vehicle_mismatch']],
    [{ hasVehicle: false, vehicleFits: false }, ['no_vehicle']],
  ])('should explain %j as %j', (failed, reasons) => {
    expect(unsuitableReasons({ ...ALL_PASS, ...failed })).toEqual(reasons);
  });

  it('should give every reason at once, in a fixed order', () => {
    expect(
      unsuitableReasons({
        onShift: false,
        freshLocation: false,
        free: false,
        hasVehicle: false,
        vehicleFits: false,
      }),
    ).toEqual(['offline', 'stale_location', 'busy', 'no_vehicle']);
  });
});

describe('toCandidateView', () => {
  it('should give the name, the distance and the age of the position in whole seconds', () => {
    expect(toCandidateView(ROW)).toEqual({
      courierId: 3,
      name: 'Дмитрий Соколов',
      vehicleType: 'car',
      pickupDistanceM: 1240,
      positionAgeSec: 45,
      hasOpenOffer: true,
    });
  });

  it('should leave the distance and the age empty without a position', () => {
    const view = toUnsuitableView({
      ...ROW,
      pickupDistanceM: null,
      positionAgeMs: null,
      freshLocation: false,
      vehicleType: null,
      hasVehicle: false,
      vehicleFits: false,
    });

    expect(view).toMatchObject({
      pickupDistanceM: null,
      positionAgeSec: null,
      vehicleType: null,
      reasons: ['stale_location', 'no_vehicle'],
    });
  });
});
