import type { PersonName } from './admin-users.types';

export type AdminTariffZone = { zoneId: number; name: string; isActive: boolean };

export type AdminTariffItem = {
  tariffId: number;
  name: string;
  pricePerKm: number;
  pricePerKg: number;
  minPrice: number;
  fragileFee: number;
  isActive: boolean;
  zones: AdminTariffZone[];
  updatedAt: Date;
  updatedBy: PersonName | null;
};
