import { formatTime } from '@/shared/lib/format';
import { Section } from '@/shared/ui/section';
import { PROGRESS_STATE, type ProgressState, type ProgressStep } from '../model/order-progress';

type StepLook = {
  marker: string;
  label: string;
  line: string;
};

const STEP_LOOKS: Record<ProgressState, StepLook> = {
  [PROGRESS_STATE.DONE]: {
    marker: 'border-primary bg-primary',
    label: '',
    line: 'not-last:after:bg-primary',
  },
  [PROGRESS_STATE.CURRENT]: {
    marker: 'border-primary bg-primary ring-4 ring-selected',
    label: 'font-semibold',
    line: 'not-last:after:bg-border',
  },
  [PROGRESS_STATE.STOPPED]: {
    marker: 'border-danger bg-danger',
    label: 'font-semibold',
    line: 'not-last:after:bg-border',
  },
  [PROGRESS_STATE.TODO]: {
    marker: 'border-border bg-page',
    label: 'text-fg-secondary',
    line: 'not-last:after:bg-border',
  },
};

const STEP_CLASS =
  'relative flex min-h-10 items-center gap-3 not-last:after:absolute not-last:after:start-[9px] not-last:after:top-[calc(50%+6px)] not-last:after:h-[calc(100%-12px)] not-last:after:w-0.5';

const MARKER_CLASS = 'relative z-1 mx-1 size-3 shrink-0 rounded-full border-2';

type OrderProgressStepsProps = {
  title: string;
  steps: readonly ProgressStep[];
};

export function OrderProgressSteps({ title, steps }: OrderProgressStepsProps) {
  return (
    <Section title={title}>
      <ol className="flex flex-col">
        {steps.map((step) => {
          const look = STEP_LOOKS[step.state];
          const isReached = step.state !== PROGRESS_STATE.TODO;
          const isCurrent =
            step.state === PROGRESS_STATE.CURRENT || step.state === PROGRESS_STATE.STOPPED;

          return (
            <li
              key={step.key}
              aria-current={isCurrent ? 'step' : undefined}
              className={`${STEP_CLASS} ${look.line}`}
            >
              <span aria-hidden="true" className={`${MARKER_CLASS} ${look.marker}`} />
              <span className={`min-w-0 flex-1 ${look.label}`}>{step.label}</span>
              {isReached && step.time !== null ? (
                <span className="shrink-0 text-small font-normal text-fg-secondary tabular-nums">
                  {formatTime(step.time)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
