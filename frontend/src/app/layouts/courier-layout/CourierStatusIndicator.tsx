import { useCourierProfile } from '@/entities/courier';
import { COURIER_STATUS_META, getCourierStatus } from './courier-status';

// Nothing is shown until /couriers/me answers (a guess could be wrong), and nothing while the
// courier has no vehicle: without one they cannot go on the line at all.
export function CourierStatusIndicator() {
  const profile = useCourierProfile();

  if (profile === null || profile.vehicle === null) {
    return null;
  }

  const { label, dotClass } = COURIER_STATUS_META[getCourierStatus(profile.isAvailable)];

  return (
    <p role="status" className="inline-flex items-center gap-2 text-small whitespace-nowrap">
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${dotClass}`} />
      {label}
    </p>
  );
}
