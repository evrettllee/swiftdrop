import type { AdminAction } from '@/common/enums/admin-action.enum';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import type { Page } from '@/common/types/page.types';
import type {
  ADMIN_USER_SORT_VALUES,
  ADMIN_VEHICLE_FILTER_VALUES,
  MANAGED_ROLES,
  USER_STATUS_VALUES,
} from '../constants/admin-users.constants';
import type { AnyAdminActionDetails } from '../schemas/admin-action-details.schema';

export type ManagedRole = (typeof MANAGED_ROLES)[number];

export type UserStatus = (typeof USER_STATUS_VALUES)[number];

export type AdminVehicleFilter = (typeof ADMIN_VEHICLE_FILTER_VALUES)[number];

export type AdminUserSort = (typeof ADMIN_USER_SORT_VALUES)[number];

export type AdminUserSearch =
  { kind: 'phone'; phone: string | null } | { kind: 'text'; pattern: string };

export type UserStatusFacts = {
  roleName: string;
  isBlocked: boolean;
  deletedAt: Date | null;
  hasPassword: boolean;
  lastLoginAt: Date | null;
};

export type PersonName = { firstName: string; lastName: string };

export type AdminUserListItem = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  createdAt: Date;
  lastLoginAt: Date | null;
  ordersCount?: number;
  vehicleType?: VehicleType | null;
  deliveredCount?: number;
};

export type AdminUsersPage = Page<AdminUserListItem>;

export type AdminUserCounts = Record<ManagedRole, number>;

export type AdminRecentOrder = {
  orderId: number;
  createdAt: Date;
  from: string;
  to: string;
  price: number | null;
  status: OrderStatus;
};

export type AdminUserOrders = {
  total: number;
  delivered: number;
  cancelled: number;
  recent: AdminRecentOrder[];
};

export type AdminUserCourier = {
  vehicleType: VehicleType | null;
  deliveredCount: number;
  cancelledCount: number;
  isAvailable: boolean;
  activeOrderId: number | null;
};

export type AdminUserHistoryEntry = {
  action: AdminAction;
  at: Date;
  actor: PersonName;
  details: AnyAdminActionDetails;
};

export type AdminUserCard = {
  userId: number;
  role: ManagedRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  login: { password: boolean; google: boolean; yandex: boolean };
  block: { reason: string | null; at: Date; by: PersonName } | null;
  invite: { sentAt: Date; expiresAt: Date } | null;
  deletion: { at: Date; by: PersonName } | null;
  courier: AdminUserCourier | null;
  orders: AdminUserOrders;
  history: AdminUserHistoryEntry[];
};
