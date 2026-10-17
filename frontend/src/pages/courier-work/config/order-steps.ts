import { type OrderStatus, ORDER_STATUS, VEHICLE_TYPE, type VehicleType } from '@/shared/api';
import { ROUTE_POINT, type RoutePointKind } from '@/shared/config';
import { ORDER_STEP_TEXTS } from './texts';

// What the courier does next on the order: each step is its own request.
export const ORDER_ACTION = {
  PICK_UP: 'pickUp',
  DEPART: 'depart',
  // Entering the delivery code comes with its own screen.
  ENTER_CODE: 'enterCode',
} as const;

export type OrderAction = (typeof ORDER_ACTION)[keyof typeof ORDER_ACTION];

export type OrderStep = {
  number: number;
  title: string;
  action: OrderAction;
  actionLabel: string;
  // The point the courier heads to now, with its person to call.
  target: RoutePointKind;
};

export const ORDER_STEPS_TOTAL = 3;

// The stages of an order the courier carries, by its status.
export const ORDER_STEPS: Partial<Record<OrderStatus, OrderStep>> = {
  [ORDER_STATUS.COURIER_ASSIGNED]: {
    number: 1,
    title: ORDER_STEP_TEXTS.TO_PICKUP,
    action: ORDER_ACTION.PICK_UP,
    actionLabel: ORDER_STEP_TEXTS.PICK_UP,
    target: ROUTE_POINT.PICKUP,
  },
  [ORDER_STATUS.PICKED_UP]: {
    number: 2,
    title: ORDER_STEP_TEXTS.PICKED_UP,
    action: ORDER_ACTION.DEPART,
    actionLabel: ORDER_STEP_TEXTS.DEPART,
    target: ROUTE_POINT.DELIVERY,
  },
  [ORDER_STATUS.IN_TRANSIT]: {
    number: 3,
    title: ORDER_STEP_TEXTS.TO_RECIPIENT,
    action: ORDER_ACTION.ENTER_CODE,
    actionLabel: ORDER_STEP_TEXTS.ENTER_CODE,
    target: ROUTE_POINT.DELIVERY,
  },
};

// The navigator of Yandex Maps: the route from where the device is to the point.
export const NAVIGATOR_URL = 'https://yandex.ru/maps/';
export const NAVIGATOR_PARAMS = {
  ROUTE: 'rtext',
  MODE: 'rtt',
} as const;
// Divides the start and the end of the route; an empty start makes the navigator take the current
// place of the device.
export const NAVIGATOR_POINTS_SEPARATOR = '~';
export const NAVIGATOR_POINT_SEPARATOR = ',';
// About 10 cm: more digits tell nothing to the navigator.
export const NAVIGATOR_COORD_DIGITS = 6;

// The way of travel of the navigator by the vehicle of the courier.
export const NAVIGATOR_MODES: Record<VehicleType, string> = {
  [VEHICLE_TYPE.FOOT]: 'pd',
  [VEHICLE_TYPE.BICYCLE]: 'bc',
  [VEHICLE_TYPE.SCOOTER]: 'auto',
  [VEHICLE_TYPE.CAR]: 'auto',
  [VEHICLE_TYPE.TRUCK]: 'auto',
};
