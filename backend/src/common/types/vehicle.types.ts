export type VehicleLimit = {
  maxWeightKg: number;
  // Package sides sorted from the longest to the shortest must each fit the matching limit.
  maxSidesCm: [number, number, number];
  allowsFragile: boolean;
};
