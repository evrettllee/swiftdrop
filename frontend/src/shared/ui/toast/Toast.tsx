import {
  ChatTextIcon,
  CheckCircleIcon,
  type Icon,
  InfoIcon,
  WarningIcon,
  XIcon,
} from '@phosphor-icons/react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT, UI_TEXTS } from '@/shared/config';
import { IconButton } from '@/shared/ui/icon-button';
import type { ToastAction, ToastVariant } from './toast-store';

const VARIANT_ICONS: Record<ToastVariant, { icon: Icon; className: string }> = {
  info: { icon: InfoIcon, className: 'text-accent' },
  success: { icon: CheckCircleIcon, className: 'text-success' },
  warning: { icon: WarningIcon, className: 'text-warning' },
  chat: { icon: ChatTextIcon, className: 'text-accent' },
};

type ToastProps = {
  variant: ToastVariant;
  title: string;
  text: string;
  action?: ToastAction;
  onClose: () => void;
};

export function Toast({ variant, title, text, action, onClose }: ToastProps) {
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
        <p className="line-clamp-2 text-pretty break-words text-fg-secondary">{text}</p>
        {action === undefined ? null : (
          <button
            type="button"
            onClick={action.onAction}
            className={`-my-2 min-h-11 self-start rounded-sm font-semibold text-accent hover:underline ${COLOR_TRANSITION_CLASS}`}
          >
            {action.label}
          </button>
        )}
      </div>
      <IconButton
        aria-label={UI_TEXTS.CLOSE}
        onClick={onClose}
        className="-my-3 -me-3 shrink-0 hover:bg-transparent"
      >
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
