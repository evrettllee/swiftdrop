// The grid of a row of "My orders", shared by the card and its skeleton: three rows on a phone,
// six columns on the desktop (the widths of the mockup). The last cell is the chevron.
export const ORDER_CARD_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-surface p-4 shadow-md [grid-template-areas:'no_st'_'rt_rt'_'sum_chev'] lg:grid-cols-[132px_minmax(0,1fr)_148px_96px_152px_20px] lg:gap-4 lg:[grid-template-areas:'no_rt_cr_sum_st_chev'] dark:border dark:border-border";
