export const TABLE_ALIGN = {
  START: 'start',
  END: 'end',
} as const;

export type TableAlign = (typeof TABLE_ALIGN)[keyof typeof TABLE_ALIGN];

export const TABLE_SORT = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending',
} as const;

export type TableSort = (typeof TABLE_SORT)[keyof typeof TABLE_SORT];
