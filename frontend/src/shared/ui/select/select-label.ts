export const SELECT_LABEL = {
  ABOVE: 'above',
  INLINE: 'inline',
  HIDDEN: 'hidden',
} as const;

export type SelectLabel = (typeof SELECT_LABEL)[keyof typeof SELECT_LABEL];
