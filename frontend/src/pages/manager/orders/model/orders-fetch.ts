import { getApiErrorMessage } from '@/shared/api';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';

export type FetchOutcome<T> = { data: T; message: null } | { data: null; message: string };

export async function fetchOutcome<T>(load: () => Promise<T>): Promise<FetchOutcome<T>> {
  try {
    return { data: await load(), message: null };
  } catch (error) {
    return { data: null, message: getApiErrorMessage(error, MANAGER_ORDERS_TEXTS.LIST_FAILED) };
  }
}
