export const ORDER_ACTION = {
  ASSIGN: 'assign',
  RESTART: 'restart',
  REASSIGN: 'reassign',
  CANCEL: 'cancel',
} as const;

export type OrderAction = (typeof ORDER_ACTION)[keyof typeof ORDER_ACTION];
