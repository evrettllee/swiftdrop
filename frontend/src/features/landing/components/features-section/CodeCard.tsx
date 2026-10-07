import { FEATURES } from '../../constants/sections';
import { FeatureCard } from './FeatureCard';

const { CODE } = FEATURES;

export function CodeCard() {
  return (
    <FeatureCard
      tone="primary"
      wide
      className="lg:col-span-2 lg:justify-between"
      title={CODE.TITLE}
      text={CODE.TEXT}
    >
      <div className="grid grid-cols-4 gap-2">
        {CODE.DIGITS.map((digit, index) => (
          <span
            key={`${index}-${digit}`}
            className="flex h-13 items-center justify-center rounded-sm border border-border bg-surface text-heading-md font-semibold text-fg tabular-nums lg:h-14"
          >
            {digit}
          </span>
        ))}
      </div>
    </FeatureCard>
  );
}
