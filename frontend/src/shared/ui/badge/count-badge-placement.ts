export const COUNT_BADGE_PLACEMENT = {
  CORNER: 'corner',
  ICON: 'icon',
  INLINE: 'inline',
} as const;

export type CountBadgePlacement =
  (typeof COUNT_BADGE_PLACEMENT)[keyof typeof COUNT_BADGE_PLACEMENT];
