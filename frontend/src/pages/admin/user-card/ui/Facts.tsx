import type { ReactNode } from 'react';

export function Facts({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col gap-3">{children}</dl>;
}

type FactProps = {
  label: string;
  isMuted?: boolean;
  className?: string;
  children: ReactNode;
};

export function Fact({ label, isMuted = false, className = '', children }: FactProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-small text-fg-secondary">{label}</dt>
      <dd className={`min-w-0 text-end ${isMuted ? 'text-fg-secondary' : 'text-fg'} ${className}`}>
        {children}
      </dd>
    </div>
  );
}
