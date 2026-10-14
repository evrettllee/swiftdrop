import { VEHICLE_TYPE } from '../../../common/enums/vehicle-type.enum';
import { vehiclesThatCarry } from './vehicle-routing';

const SMALL_PACKAGE = { weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10, isFragile: false };

describe('vehiclesThatCarry', () => {
  it('should return every vehicle when the package is small', () => {
    expect(vehiclesThatCarry(SMALL_PACKAGE)).toEqual([
      VEHICLE_TYPE.FOOT,
      VEHICLE_TYPE.BICYCLE,
      VEHICLE_TYPE.SCOOTER,
      VEHICLE_TYPE.CAR,
      VEHICLE_TYPE.TRUCK,
    ]);
  });

  it('should return only the car and the truck when the package is heavy', () => {
    expect(vehiclesThatCarry({ ...SMALL_PACKAGE, weightKg: 20 })).toEqual([
      VEHICLE_TYPE.CAR,
      VEHICLE_TYPE.TRUCK,
    ]);
  });

  it('should leave out the bicycle when the package is fragile', () => {
    expect(vehiclesThatCarry({ ...SMALL_PACKAGE, isFragile: true })).not.toContain(
      VEHICLE_TYPE.BICYCLE,
    );
  });
});
