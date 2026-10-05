import type { ReactNode } from 'react';

type FeatureCardProps = {
  title: string;
  text: ReactNode;
  tone: 'selected' | 'page' | 'primary';
  // The cards of the first row have more air between the text and the illustration.
  wide?: boolean;
  className?: string;
  children?: ReactNode;
};

const TONE_CLASS = {
  selected: 'border border-border bg-selected',
  page: 'border border-border bg-page',
  primary: 'bg-primary text-on-primary',
} as const;

// The frame of a card of the features section: a title, a text and an illustration below them.
export function FeatureCard({
  title,
  text,
  tone,
  wide = false,
  className = '',
  children,
}: FeatureCardProps) {
  return (
    <article
      className={`flex flex-col gap-4 rounded-xl p-6 lg:p-8 ${wide ? 'lg:gap-8' : 'lg:gap-6'} ${TONE_CLASS[tone]} ${className}`}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-heading-sm font-semibold">{title}</h3>
        <p className={`max-w-130 ${tone === 'primary' ? 'opacity-90' : 'text-fg-secondary'}`}>
          {text}
        </p>
      </div>
      {children}
    </article>
  );
}
