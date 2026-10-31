import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { PaymentState } from '../constants/manager-orders.constants';
import type { ManagerOrderStreet } from './manager-orders.types';

type Person = { firstName: string; lastName: string; phone?: string | null };

export type ManagerExportRow = {
  orderId: number;
  createdAt: Date;
  status: OrderStatus;
  client: Person;
  pickup: ManagerOrderStreet;
  delivery: ManagerOrderStreet;
  courier: Person | null;
  price: string;
  paymentState: PaymentState;
  finishedAt: Date | null;
};

export type ExportCellKind = 'number' | 'text' | 'date' | 'money';

export type ExportCell = string | number | Date | null;

export type ExportColumn = {
  header: string;
  kind: ExportCellKind;
  width: number;
};

export type ExportTable = {
  columns: ExportColumn[];
  rows: ExportCell[][];
};

export type ExportFile = {
  filename: string;
  contentType: string;
  body: Buffer;
};
