// A footer link leads to a section of the landing, to a page of the app, or starts an order.
export type FooterLink = {
  label: string;
  // The mobile footer shows a shorter list than the desktop one.
  showOnMobile: boolean;
} & (
  | { anchor: string; route?: never; startsOrder?: never }
  | { route: string; anchor?: never; startsOrder?: never }
  // The "order" link: where it leads depends on who is signed in.
  | { startsOrder: true; anchor?: never; route?: never }
);

export type FooterGroup = {
  title: string;
  links: readonly FooterLink[];
};
