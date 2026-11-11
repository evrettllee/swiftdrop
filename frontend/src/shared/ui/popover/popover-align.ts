export const POPOVER_ALIGN = {
  START: 'start',
  END: 'end',
} as const;

export type PopoverAlign = (typeof POPOVER_ALIGN)[keyof typeof POPOVER_ALIGN];

export const POPOVER_KIND = {
  DIALOG: 'dialog',
  MENU: 'menu',
} as const;

export type PopoverKind = (typeof POPOVER_KIND)[keyof typeof POPOVER_KIND];
