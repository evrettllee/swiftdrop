import type { ReactNode } from 'react';

type OrderActionBarProps = {
  children: ReactNode;
};

// The main button of a phone, fixed above the bottom menu and its safe area. The expanded map
// covers it. `data-action-bar` makes the page scroll a focused element clear of it (index.css).
export function OrderActionBar({ children }: OrderActionBarProps) {
  return (
    <div
      data-action-bar=""
      className="fixed inset-x-0 bottom-16 z-10 mb-[env(safe-area-inset-bottom)] border-t border-border bg-surface px-4 py-3 lg:hidden"
    >
      {children}
    </div>
  );
}
