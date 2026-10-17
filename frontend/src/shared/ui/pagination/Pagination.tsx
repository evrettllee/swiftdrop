import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT, PAGINATION_TEXTS } from '@/shared/config';

const PAGE_BUTTON_CLASS = `grid size-9 place-items-center rounded-md border border-border bg-surface text-fg hover:bg-surface-muted disabled:text-fg-muted disabled:hover:bg-surface ${COLOR_TRANSITION_CLASS}`;

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
};

// The footer of a list: "1–5 из 23" on the left, "‹ Страница 1 из 5 ›" on the right.
export function Pagination({ page, totalPages, total, pageSize, onChange }: PaginationProps) {
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav aria-label={PAGINATION_TEXTS.LABEL} className="flex items-center justify-between gap-4">
      <span className="text-small text-fg-secondary tabular-nums">
        {PAGINATION_TEXTS.range(first, last, total)}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={PAGINATION_TEXTS.PREVIOUS}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className={PAGE_BUTTON_CLASS}
        >
          <CaretLeftIcon size={ICON_SIZE.SMALL} weight={ICON_WEIGHT} aria-hidden="true" />
        </button>
        <span className="text-small text-fg-secondary tabular-nums">
          {PAGINATION_TEXTS.page(page, totalPages)}
        </span>
        <button
          type="button"
          aria-label={PAGINATION_TEXTS.NEXT}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className={PAGE_BUTTON_CLASS}
        >
          <CaretRightIcon size={ICON_SIZE.SMALL} weight={ICON_WEIGHT} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
