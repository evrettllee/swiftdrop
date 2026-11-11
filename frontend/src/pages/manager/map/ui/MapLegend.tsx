import { LEGEND_TEXTS } from '../config/texts';

const ITEMS = [
  { text: LEGEND_TEXTS.FREE, className: 'bg-accent' },
  { text: LEGEND_TEXTS.ON_ORDER, className: 'border-2 border-accent bg-page' },
  { text: LEGEND_TEXTS.NO_SIGNAL, className: 'bg-fg-muted' },
] as const;

export function MapLegend() {
  return (
    <div
      aria-hidden="true"
      className="absolute start-3 bottom-10 flex gap-3 rounded-md border border-border bg-surface px-3 py-2 text-caption text-fg shadow-sm lg:gap-4"
    >
      {ITEMS.map(({ text, className }) => (
        <span key={text} className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className={`size-3 shrink-0 rounded-full ${className}`} />
          {text}
        </span>
      ))}
    </div>
  );
}
