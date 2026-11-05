import type { ReactNode } from 'react';

export const PRIMARY_ACTION_PLACE = {
  NONE: 'none',
  HEADER: 'header',
  EMPTY: 'empty',
} as const;

export type PrimaryActionPlace = (typeof PRIMARY_ACTION_PLACE)[keyof typeof PRIMARY_ACTION_PLACE];

export type PrimaryActionList = {
  isLoading: boolean;
  isEmpty: boolean;
  hasEmptyAction?: boolean;
};

export function primaryActionPlace({
  isLoading,
  isEmpty,
  hasEmptyAction = true,
}: PrimaryActionList): PrimaryActionPlace {
  if (isLoading) {
    return PRIMARY_ACTION_PLACE.NONE;
  }

  return isEmpty && hasEmptyAction ? PRIMARY_ACTION_PLACE.EMPTY : PRIMARY_ACTION_PLACE.HEADER;
}

export type PlacedPrimaryAction = { header: ReactNode; empty: ReactNode };

export function placePrimaryAction(
  action: ReactNode,
  list: PrimaryActionList,
): PlacedPrimaryAction {
  const place = primaryActionPlace(list);

  return {
    header: place === PRIMARY_ACTION_PLACE.HEADER ? action : null,
    empty: place === PRIMARY_ACTION_PLACE.EMPTY ? action : null,
  };
}
