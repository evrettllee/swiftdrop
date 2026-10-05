export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type PackageSpec = {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  isFragile: boolean;
};

export type VehicleLimit = {
  maxWeightKg: number;
  // Package sides sorted from the longest to the shortest must each fit the matching limit.
  maxSidesCm: [number, number, number];
  allowsFragile: boolean;
};
