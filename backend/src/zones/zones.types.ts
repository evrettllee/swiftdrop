export type ServiceZoneMatch = {
  zoneId: number;
  name: string;
  tariffId: number;
};

export type ZoneCandidate = ServiceZoneMatch & {
  priority: number;
  // GeoJSON polygon: list of rings, each ring is a list of [longitude, latitude] points.
  polygon: number[][][];
};
