import type { ReactNode } from 'react';

type FactProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

export function Fact({ label, className = '', children }: FactProps) {
  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <dt className="text-small text-fg-secondary">{label}</dt>
      <dd className="truncate tabular-nums">{children}</dd>
    </div>
  );
}
