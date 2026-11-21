import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Panel } from '@/shared/ui/panel';
import type { HistoryEntry } from '../api/admin-user-card';
import { USER_CARD_TEXTS as TEXTS } from '../config/texts';
import { historyView } from '../lib/history';

export function HistoryPanel({ history }: { history: HistoryEntry[] }) {
  const rows = history.flatMap((entry, index) => {
    const row = historyView(entry);

    return row === null ? [] : [{ ...row, key: `${entry.at.getTime()}-${index}` }];
  });

  return (
    <Panel title={TEXTS.HISTORY}>
      {rows.length === 0 ? (
        <p className="text-small text-fg-secondary">{TEXTS.NO_HISTORY}</p>
      ) : (
        <ul className="flex flex-col">
          {rows.map(({ key, title, details, meta, icon: RowIcon }) => (
            <li
              key={key}
              className="flex items-start gap-3 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
            >
              <RowIcon
                size={ICON_SIZE.MEDIUM}
                weight={ICON_WEIGHT}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-fg-secondary"
              />
              <div className="flex min-w-0 flex-col">
                <span>{title}</span>
                {details === null ? null : (
                  <span className="text-small text-pretty break-words text-fg-secondary">
                    {details}
                  </span>
                )}
                <span className="text-small text-fg-secondary tabular-nums">{meta}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
