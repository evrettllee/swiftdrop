import { decodePolyline, encodePolyline, polylineUntil } from './polyline';

// Three points of central Minsk, in millionths of a degree.
const POINTS = [
  { lat: 53_920_000, lng: 27_600_000 },
  { lat: 53_900_600, lng: 27_559_000 },
  { lat: 53_907_500, lng: 27_457_000 },
];

describe('polyline6', () => {
  it('should give back the same points after encoding and decoding', () => {
    expect(decodePolyline(encodePolyline(POINTS))).toEqual(POINTS);
  });

  it('should encode negative coordinates too', () => {
    const southWest = [{ lat: -33_868_800, lng: -151_209_300 }];

    expect(decodePolyline(encodePolyline(southWest))).toEqual(southWest);
  });

  it('should cut the line at the point closest to the given one, keeping it', () => {
    const line = encodePolyline(POINTS);
    // A waypoint snapped a few metres off the second point.
    const waypoint = { latitude: 53.900_61, longitude: 27.559_02 };

    expect(decodePolyline(polylineUntil(line, waypoint))).toEqual(POINTS.slice(0, 2));
  });

  it('should keep the whole line when the point is its end', () => {
    const line = encodePolyline(POINTS);

    expect(polylineUntil(line, { latitude: 53.9075, longitude: 27.457 })).toBe(line);
  });
});
