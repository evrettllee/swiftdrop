import { EnvelopeSimpleIcon, type Icon, ProhibitIcon } from '@phosphor-icons/react';
import { InlineAlert } from '@/shared/ui/inline-alert';
import type { StateAlert } from '../lib/card-view';

const ALERT_ICONS: Partial<Record<StateAlert['kind'], Icon>> = {
  blocked: ProhibitIcon,
  invite: EnvelopeSimpleIcon,
};

export function CardStateAlert({ alert }: { alert: StateAlert }) {
  return (
    <InlineAlert variant={alert.variant} icon={ALERT_ICONS[alert.kind]} title={alert.title}>
      {alert.text}
    </InlineAlert>
  );
}
