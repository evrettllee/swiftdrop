import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { ArrowDownIcon, ArrowUpIcon } from '@phosphor-icons/react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { TABLE_ALIGN, TABLE_SORT, type TableAlign, type TableSort } from './table-options';

const ALIGN_CLASSES: Record<TableAlign, string> = {
  start: 'text-start',
  end: 'text-end',
};

type TableProps = {
  label: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function Table({ label, footer, children }: TableProps) {
  return (
    <div className="rounded-lg bg-surface p-2 shadow-md dark:border dark:border-border">
      <div className="overflow-x-auto">
        <table aria-label={label} className="w-full border-collapse text-small">
          {children}
        </table>
      </div>
      {footer === undefined ? null : (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-2 pt-3 pb-1 text-small">
          {footer}
        </div>
      )}
    </div>
  );
}

type TableHeaderCellProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> & {
  align?: TableAlign;
  sort?: TableSort;
  onSort?: () => void;
};

const HEADER_CONTENT_CLASS = 'inline-flex items-center gap-1';

export function TableHeaderCell({
  align = TABLE_ALIGN.START,
  sort,
  onSort,
  className = '',
  children,
  ...rest
}: TableHeaderCellProps) {
  const SortIcon = sort === TABLE_SORT.ASCENDING ? ArrowUpIcon : ArrowDownIcon;
  const content = (
    <>
      {children}
      {sort === undefined ? null : (
        <SortIcon
          size={ICON_SIZE.SMALL}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="text-accent"
        />
      )}
    </>
  );

  return (
    <th
      scope="col"
      aria-sort={sort}
      className={joinClassNames(
        'h-11 border-b border-border px-2 text-caption font-semibold tracking-caps whitespace-nowrap uppercase',
        sort === undefined ? 'text-fg-secondary' : 'text-fg',
        ALIGN_CLASSES[align],
        className,
      )}
      {...rest}
    >
      {onSort === undefined ? (
        <span className={HEADER_CONTENT_CLASS}>{content}</span>
      ) : (
        <button
          type="button"
          onClick={onSort}
          className={`-mx-1 min-h-11 rounded-sm px-1 uppercase hover:text-accent ${HEADER_CONTENT_CLASS} ${COLOR_TRANSITION_CLASS}`}
        >
          {content}
        </button>
      )}
    </th>
  );
}

type TableRowProps = {
  isSelected?: boolean;
  children: ReactNode;
};

export function TableRow({ isSelected = false, children }: TableRowProps) {
  return (
    <tr
      className={`relative ${isSelected ? 'bg-selected' : 'hover:bg-surface-muted'} has-[a:focus-visible]:bg-surface-muted has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-accent [&:last-child>td]:border-b-0 ${COLOR_TRANSITION_CLASS}`}
    >
      {children}
    </tr>
  );
}

type TableCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> & {
  align?: TableAlign;
};

export function TableCell({
  align = TABLE_ALIGN.START,
  className = '',
  children,
  ...rest
}: TableCellProps) {
  return (
    <td
      className={joinClassNames(
        'h-14 border-b border-border px-2 align-middle',
        ALIGN_CLASSES[align],
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}
