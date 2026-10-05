import type { ROUTE_POINT } from './constants';

// A footer link leads either to a section of the landing or to a page of the app.
export type FooterLink = {
  label: string;
  // The mobile footer shows a shorter list than the desktop one.
  showOnMobile: boolean;
} & ({ anchor: string; route?: never } | { route: string; anchor?: never });

export type FooterGroup = {
  title: string;
  links: readonly FooterLink[];
};

export type RoutePointKind = (typeof ROUTE_POINT)[keyof typeof ROUTE_POINT];
