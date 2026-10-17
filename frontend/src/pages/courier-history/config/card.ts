// The grid of a card of the history, shared by the card and its skeleton: three rows on a phone,
// five columns on the desktop (the widths of the mockup). The mockup ends a row with a chevron to
// the order; a courier has no page of a finished order, so there is neither the chevron nor its
// column.
export const HISTORY_CARD_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-transparent bg-surface p-4 shadow-md [grid-template-areas:'no_st'_'rt_rt'_'bot_bot'] lg:grid-cols-[132px_minmax(0,1fr)_148px_96px_152px] lg:gap-4 lg:[grid-template-areas:'no_rt_km_kg_st'] dark:border-border";
