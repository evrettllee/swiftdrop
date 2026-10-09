import {
  CheckCircleIcon,
  type Icon,
  InfoIcon,
  WarningCircleIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';

type AlertVariant = 'success' | 'error' | 'info' | 'warning';

type VariantConfig = {
  icon: Icon;
  role: 'alert' | 'status';
  borderClass: string;
  iconClass: string;
  // A warning and an error also color their title (design system §1).
  titleClass: string;
};

const VARIANTS: Record<AlertVariant, VariantConfig> = {
  success: {
    icon: CheckCircleIcon,
    role: 'status',
    borderClass: 'border-success',
    iconClass: 'text-success',
    titleClass: 'text-fg',
  },
  error: {
    icon: WarningCircleIcon,
    role: 'alert',
    borderClass: 'border-danger',
    iconClass: 'text-danger',
    titleClass: 'text-danger',
  },
  info: {
    icon: InfoIcon,
    role: 'status',
    borderClass: 'border-accent',
    iconClass: 'text-accent',
    titleClass: 'text-fg',
  },
  warning: {
    icon: WarningIcon,
    role: 'status',
    borderClass: 'border-warning',
    iconClass: 'text-warning',
    titleClass: 'text-warning',
  },
};

type InlineAlertProps = {
  variant: AlertVariant;
  title?: string;
  // Replaces the icon of the variant, for example a clock for a payment that is waited for.
  icon?: Icon;
  children?: ReactNode;
};

export function InlineAlert({ variant, title, icon, children }: InlineAlertProps) {
  const config = VARIANTS[variant];
  const AlertIcon = icon ?? config.icon;
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
        {title === undefined ? null : (
          <p className={`font-semibold ${config.titleClass}`}>{title}</p>
        )}
        {children === undefined ? null : (
          <div className={`text-pretty ${textClass}`}>{children}</div>
        )}
      </div>
    </div>
  );
}
