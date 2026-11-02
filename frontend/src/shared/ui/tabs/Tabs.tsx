import type { KeyboardEvent, ReactNode } from 'react';
import { COLOR_TRANSITION_CLASS, ID_PART } from '@/shared/config';
import { formatCount } from '@/shared/lib/format';

type TabItem<TId extends string> = {
  id: TId;
  label: string;
  // A number after the label, for example how many orders the tab holds; null while unknown.
  count?: number | null;
};

// `fill`: the tabs share the whole width (sign in and sign up).
// `fit`: each tab is as wide as its text, the row scrolls when it does not fit (lists).
type TabsLayout = 'fill' | 'fit';

const TAB_KEYS = {
  NEXT: 'ArrowRight',
  PREVIOUS: 'ArrowLeft',
  FIRST: 'Home',
  LAST: 'End',
} as const;

// A scrolling row cuts off whatever sticks out of it, so in `fit` the common line is an inner
// shadow under the tabs instead of a border, and the active line does not have to overlap it.
// The scrollbar is hidden: the row is scrolled with a finger or a touchpad.
const LIST_LAYOUT_CLASSES: Record<TabsLayout, string> = {
  fill: 'border-b border-border',
  fit: 'gap-6 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--color-border)] [scrollbar-width:none]',
};

const TAB_LAYOUT_CLASSES: Record<TabsLayout, string> = {
  fill: '-mb-px flex-1 justify-center px-2',
  fit: 'shrink-0',
};

const tabDomId = (prefix: string, id: string) => `${prefix}-${ID_PART.TAB}-${id}`;
const panelDomId = (prefix: string, id: string) => `${prefix}-${ID_PART.PANEL}-${id}`;

function getTargetIndex(key: string, current: number, count: number): number | null {
  let target: number | null = null;

  if (key === TAB_KEYS.NEXT) {
    target = (current + 1) % count;
  } else if (key === TAB_KEYS.PREVIOUS) {
    target = (current - 1 + count) % count;
  } else if (key === TAB_KEYS.FIRST) {
    target = 0;
  } else if (key === TAB_KEYS.LAST) {
    target = count - 1;
  }

  return target;
}

type TabsProps<TId extends string> = {
  tabs: TabItem<TId>[];
  value: TId;
  onChange: (id: TId) => void;
  label: string;
  idPrefix: string;
  layout?: TabsLayout;
};

export function Tabs<TId extends string>({
  tabs,
  value,
  onChange,
  label,
  idPrefix,
  layout = 'fill',
}: TabsProps<TId>) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const current = tabs.findIndex((tab) => tab.id === value);
    const targetIndex = getTargetIndex(event.key, current, tabs.length);

    if (targetIndex !== null) {
      event.preventDefault();
      const target = tabs[targetIndex];
      onChange(target.id);
      document.getElementById(tabDomId(idPrefix, target.id))?.focus();
    }
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={`flex ${LIST_LAYOUT_CLASSES[layout]}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === value;

        return (
          <button
            key={tab.id}
            id={tabDomId(idPrefix, tab.id)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelDomId(idPrefix, tab.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-11 items-center gap-2 whitespace-nowrap border-b-2 text-body ${COLOR_TRANSITION_CLASS} ${TAB_LAYOUT_CLASSES[layout]} ${
              isActive
                ? 'border-accent font-semibold text-accent'
                : 'border-transparent text-fg-secondary hover:text-fg'
            }`}
          >
            {tab.label}
            {tab.count === undefined || tab.count === null ? null : (
              <span
                className={`text-small font-normal tabular-nums ${isActive ? 'text-accent' : 'text-fg-secondary'}`}
              >
                {formatCount(tab.count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

type TabPanelProps<TId extends string> = {
  idPrefix: string;
  id: TId;
  activeId: TId;
  children: ReactNode;
};

export function TabPanel<TId extends string>({
  idPrefix,
  id,
  activeId,
  children,
}: TabPanelProps<TId>) {
  const isActive = id === activeId;

  return (
    <div
      role="tabpanel"
      id={panelDomId(idPrefix, id)}
      aria-labelledby={tabDomId(idPrefix, id)}
      hidden={!isActive}
      className="flex flex-col gap-6"
    >
      {isActive ? children : null}
    </div>
  );
}
