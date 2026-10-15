import { GpsSlashIcon } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { GEO_PROBLEM, type GeoProblem } from '../config/geolocation';
import { GEO_ALERT_TEXTS } from '../config/texts';

type GeoAlertProps = {
  problem: GeoProblem;
  isChecking: boolean;
  onRetry: () => void;
};

// The browser gave no position, so the courier stayed off the line: what to do and a new try.
export function GeoAlert({ problem, isChecking, onRetry }: GeoAlertProps) {
  const isDenied = problem === GEO_PROBLEM.DENIED;

  return (
    <InlineAlert
      variant="error"
      icon={GpsSlashIcon}
      title={isDenied ? GEO_ALERT_TEXTS.DENIED_TITLE : GEO_ALERT_TEXTS.FAILED_TITLE}
    >
      <div className="flex flex-col items-start gap-2">
        <p>{isDenied ? GEO_ALERT_TEXTS.DENIED_HINT : GEO_ALERT_TEXTS.FAILED_HINT}</p>
        <Button variant="secondary" loading={isChecking} onClick={onRetry}>
          {GEO_ALERT_TEXTS.RETRY}
        </Button>
      </div>
    </InlineAlert>
  );
}
