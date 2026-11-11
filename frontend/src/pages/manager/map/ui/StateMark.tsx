import { COURIER_MAP_STATE, type CourierMapState } from '@/shared/staff-api';

const DOT_CLASSES: Record<CourierMapState, string> = {
  [COURIER_MAP_STATE.FREE]: 'bg-accent',
  [COURIER_MAP_STATE.OFFER]: 'bg-accent',
  [COURIER_MAP_STATE.ON_ORDER]: 'border-2 border-accent',
  [COURIER_MAP_STATE.NO_SIGNAL]: 'bg-fg-muted',
};

type StateMarkProps = {
  state: CourierMapState;
  text: string;
};

export function StateMark({ state, text }: StateMarkProps) {
  return (
    <span className="inline-flex items-center gap-2 text-small whitespace-nowrap tabular-nums">
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${DOT_CLASSES[state]}`} />
      {text}
    </span>
  );
}
