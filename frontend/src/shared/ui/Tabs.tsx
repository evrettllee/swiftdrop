import type { KeyboardEvent, ReactNode } from 'react';
import { ID_PART } from '../constants/dom';
import { COLOR_TRANSITION_CLASS } from '../constants/styles';

type TabItem<TId extends string> = { id: TId; label: string };

const TAB_KEYS = {
  NEXT: 'ArrowRight',
  PREVIOUS: 'ArrowLeft',
  FIRST: 'Home',
  LAST: 'End',
} as const;

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
};

export function Tabs<TId extends string>({
  tabs,
  value,
  onChange,
  label,
  idPrefix,
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
      className="flex border-b border-border"
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
            className={`-mb-px h-11 flex-1 whitespace-nowrap border-b-2 px-2 text-center text-body ${COLOR_TRANSITION_CLASS} ${
              isActive
                ? 'border-accent font-semibold text-accent'
                : 'border-transparent text-fg-secondary hover:text-fg'
            }`}
          >
            {tab.label}
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
