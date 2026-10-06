import { UI_TEXTS } from '../constants/texts';

type SpinnerProps = {
  tone?: 'accent' | 'on-primary';
};

const TONE_CLASSES = {
  accent: 'border-border border-t-accent',
  'on-primary': 'border-on-primary/30 border-t-on-primary',
} as const;

// 20px, 2px border, 800ms linear, as in the design system. When the user asks for less motion the
// spinner turns slower instead of stopping: it is the only sign that something is loading.
export function Spinner({ tone = 'accent' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={UI_TEXTS.LOADING}
      className={`inline-block size-5 animate-spin rounded-full border-2 [animation-duration:800ms] motion-reduce:[animation-duration:2400ms] ${TONE_CLASSES[tone]}`}
    />
  );
}
