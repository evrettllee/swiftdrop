export const FILTERS_FORM_LAYOUT = {
  PANEL: 'panel',
  SHEET: 'sheet',
} as const;

export type FiltersFormLayout = (typeof FILTERS_FORM_LAYOUT)[keyof typeof FILTERS_FORM_LAYOUT];
