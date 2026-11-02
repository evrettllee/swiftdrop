export const POPOVER_ALIGN = {
  START: 'start',
  END: 'end',
} as const;

export type PopoverAlign = (typeof POPOVER_ALIGN)[keyof typeof POPOVER_ALIGN];
