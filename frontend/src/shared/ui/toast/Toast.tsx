import { type Icon, InfoIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT, UI_TEXTS } from '@/shared/config';
import { IconButton } from '@/shared/ui/icon-button';

type ToastVariant = 'info' | 'warning';

const VARIANT_ICONS: Record<ToastVariant, { icon: Icon; className: string }> = {
  info: { icon: InfoIcon, className: 'text-accent' },
  warning: { icon: WarningIcon, className: 'text-warning' },
};

type ToastProps = {
  variant: ToastVariant;
  title: string;
  text: string;
  onClose: () => void;
};

// A short message over the page (design system §13). The caller places it and keeps it in a live
// region, so screen readers read it when it appears.
export function Toast({ variant, title, text, onClose }: ToastProps) {
  const { icon: VariantIcon, className } = VARIANT_ICONS[variant];

  return (
    <div className="flex items-start gap-3 rounded-lg border border-transparent bg-surface p-4 shadow-lg dark:border-border dark:bg-surface-muted">
      <VariantIcon
        size={ICON_SIZE.LARGE}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className={`shrink-0 ${className}`}
      />
      <div className="flex min-w-0 grow flex-col gap-1 text-small">
        <p className="font-semibold">{title}</p>
        <p className="text-pretty text-fg-secondary">{text}</p>
      </div>
      <IconButton aria-label={UI_TEXTS.CLOSE} onClick={onClose} className="-my-3 -me-3 shrink-0">
        <XIcon
          size={ICON_SIZE.SMALL}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="text-fg-secondary"
        />
      </IconButton>
    </div>
  );
}
