import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  WarningIcon,
  type Icon,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '../constants';

type AlertVariant = 'success' | 'error' | 'info' | 'warning';

type VariantConfig = {
  icon: Icon;
  role: 'alert' | 'status';
  borderClass: string;
  iconClass: string;
};

const VARIANTS: Record<AlertVariant, VariantConfig> = {
  success: {
    icon: CheckCircleIcon,
    role: 'status',
    borderClass: 'border-success',
    iconClass: 'text-success',
  },
  error: {
    icon: WarningCircleIcon,
    role: 'alert',
    borderClass: 'border-danger',
    iconClass: 'text-danger',
  },
  info: { icon: InfoIcon, role: 'status', borderClass: 'border-accent', iconClass: 'text-accent' },
  warning: {
    icon: WarningIcon,
    role: 'status',
    borderClass: 'border-warning',
    iconClass: 'text-warning',
  },
};

type InlineAlertProps = {
  variant: AlertVariant;
  title?: string;
  children?: ReactNode;
};

export function InlineAlert({ variant, title, children }: InlineAlertProps) {
  const config = VARIANTS[variant];
  const AlertIcon = config.icon;
  const textClass = title === undefined ? 'text-fg' : 'text-fg-secondary';

  return (
    <div
      role={config.role}
      className={`flex items-start gap-3 rounded-md border bg-surface px-4 py-3 text-small ${config.borderClass}`}
    >
      <AlertIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${config.iconClass}`}
      />
      <div className="flex flex-col gap-0.5">
        {title === undefined ? null : <p className="font-semibold text-fg">{title}</p>}
        {children === undefined ? null : <div className={textClass}>{children}</div>}
      </div>
    </div>
  );
}
