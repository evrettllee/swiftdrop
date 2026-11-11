import { ORDER_STATUS, type OrderStatus } from '@/shared/api';
import { MS_PER_MINUTE } from '@/shared/config';
import { LONG_WAIT_MS } from '../config/list';

const NAME_PARTS = /\s+/;

export function shortPersonName(name: string): string {
  const [first, ...rest] = name.trim().split(NAME_PARTS);
  const last = rest.at(-1);

  return last === undefined || first === undefined ? name.trim() : `${first} ${last.charAt(0)}.`;
}

export function waitingMinutes(since: Date, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - since.getTime()) / MS_PER_MINUTE));
}

export function isLongWait(since: Date, nowMs: number): boolean {
  return nowMs - since.getTime() >= LONG_WAIT_MS;
}

export function formatStreet({ street, house }: { street: string; house: string }): string {
  return `${street}, ${house}`;
}

export function isAwaitingAssignment(status: OrderStatus): boolean {
  return status === ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT;
}
