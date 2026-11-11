import type { ReactNode } from 'react';
import { COURIER_TEXTS as TEXTS } from '../config/texts';
import type { CourierRow } from '../lib/courier-row';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-fg-secondary">
      {label} <span className="text-fg">{value}</span>
    </span>
  );
}

type CourierCardsProps = {
  rows: readonly CourierRow[];
  footer?: ReactNode;
};

export function CourierCards({ rows, footer }: CourierCardsProps) {
  return (
    <div className="flex flex-col gap-4">
      <ul aria-label={TEXTS.TABLE} className="flex flex-col gap-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-md dark:border dark:border-border"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold">{row.name}</span>
                {row.vehicle === null ? null : (
                  <span className="text-small text-fg-secondary">{row.vehicle}</span>
                )}
              </div>
              <span className="shrink-0 font-semibold tabular-nums">{row.deliveries}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-small tabular-nums">
              <Stat label={TEXTS.ON_TIME_SHORT} value={row.onTime} />
              <Stat label={TEXTS.AVG_SHORT} value={row.avgTime} />
              <Stat label={TEXTS.DECLINED_SHORT} value={row.declined} />
              <Stat label={TEXTS.HOURS_SHORT} value={row.hoursShort} />
            </div>
          </li>
        ))}
      </ul>
      {footer}
    </div>
  );
}
