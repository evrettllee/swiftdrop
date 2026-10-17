import type { OrderDetails } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';

// The last answer about an order, with the request (`key`) it was given for.
export type StoredAnswer = {
  key: string;
  orderId: number | null;
  status: ListStatus;
  order: OrderDetails | null;
  isNotFound: boolean;
  message: string | null;
};

export const NO_ANSWER: StoredAnswer = {
  key: '',
  orderId: null,
  status: LIST_STATUS.LOADING,
  order: null,
  isNotFound: false,
  message: null,
};
