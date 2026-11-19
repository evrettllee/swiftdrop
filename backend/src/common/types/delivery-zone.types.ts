export type DeliveryZoneRow = {
  zoneId: number | null;
  name: string;
  orders: number;
  onTime: number;
  onTimeTotal: number;
  averageDeliveryMinutes: number | null;
  manualAssigned: number;
  revenue: number;
};
