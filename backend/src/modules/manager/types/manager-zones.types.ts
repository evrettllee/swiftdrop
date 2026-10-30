export type ZoneRow = {
  zoneId: number;
  name: string;
  tariffId: number;
  tariffName: string;
  priority: number;
  isActive: boolean;
  polygon: number[][][];
  updatedAt: Date;
};

export type ManagerZone = {
  id: number;
  name: string;
  tariff: { id: number; name: string };
  priority: number;
  isActive: boolean;
  vertexCount: number;
  areaKm2: number;
  updatedAt: string;
};

export type ManagerZoneDetails = ManagerZone & { polygon: number[][][] };

export type ManagerTariffOption = { id: number; name: string };

export type ZoneWriteResult = { zoneId: number };
