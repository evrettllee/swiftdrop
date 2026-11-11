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

export function primaryActionPlace(
  { isLoading, isEmpty, hasEmptyAction = true }: PrimaryActionList,
  settled: PrimaryActionPlace | null = null,
): PrimaryActionPlace {
  if (isLoading) {
    return settled ?? PRIMARY_ACTION_PLACE.NONE;
  }

  return isEmpty && hasEmptyAction ? PRIMARY_ACTION_PLACE.EMPTY : PRIMARY_ACTION_PLACE.HEADER;
}

export type PlacedPrimaryAction = { header: ReactNode; empty: ReactNode };

export function placePrimaryAction(
  action: ReactNode,
  place: PrimaryActionPlace,
): PlacedPrimaryAction {
  return {
    header: place === PRIMARY_ACTION_PLACE.HEADER ? action : null,
    empty: place === PRIMARY_ACTION_PLACE.EMPTY ? action : null,
  };
}
