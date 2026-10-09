import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';
import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { Spinner } from '@/shared/ui/spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'inverse' | 'danger';

const BASE_CLASS = `inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-md px-4 py-2.5 text-body font-semibold ${COLOR_TRANSITION_CLASS}`;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary shadow-sm hover:bg-primary-hover active:bg-primary-pressed disabled:bg-border disabled:text-fg-muted disabled:shadow-none dark:disabled:border dark:disabled:border-border dark:disabled:bg-surface-muted',
  secondary:
    'border border-border-button bg-surface text-accent shadow-sm hover:bg-selected active:bg-border disabled:border-transparent disabled:bg-border disabled:text-fg-muted disabled:shadow-none dark:disabled:border-border dark:disabled:bg-surface-muted',
  text: 'text-accent hover:bg-selected active:bg-border disabled:bg-border disabled:text-fg-muted dark:disabled:bg-surface-muted',
  // A light button for a block filled with the primary color.
  inverse: 'bg-inverse text-on-inverse hover:opacity-90 active:opacity-80 disabled:opacity-50',
  // A destructive action, for example cancelling an order.
  danger:
    'bg-danger-solid text-on-primary shadow-sm hover:bg-danger-solid-hover active:bg-danger-solid-pressed disabled:bg-border disabled:text-fg-muted disabled:shadow-none dark:disabled:border dark:disabled:border-border dark:disabled:bg-surface-muted',
};

const SOLID_VARIANTS: ReadonlySet<ButtonVariant> = new Set(['primary', 'danger']);

type CommonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
};

function buildClassName(variant: ButtonVariant, fullWidth: boolean, isLoading: boolean): string {
  return joinClassNames(
    BASE_CLASS,
    VARIANT_CLASSES[variant],
    fullWidth ? 'w-full' : '',
    isLoading ? 'pointer-events-none' : '',
  );
}

type ButtonProps = CommonProps & { loading?: boolean } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children'
  >;

// While loading, the variant colors stay and a spinner takes the place of the icon.
export function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  icon,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      className={buildClassName(variant, fullWidth, loading)}
      {...rest}
    >
      {loading ? (
        <span aria-hidden="true">
          <Spinner tone={SOLID_VARIANTS.has(variant) ? 'on-primary' : 'accent'} />
        </span>
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps & {
  // Runs before the navigation, for example to remember what the next page needs.
  onClick?: () => void;
} & ({ href: string; to?: never } | { to: string; href?: never });

// A link that looks like a button: `to` for pages of the app, `href` for full-page navigation.
export function LinkButton({
  variant = 'primary',
  fullWidth = false,
  icon,
  onClick,
  children,
  ...target
}: LinkButtonProps) {
  const className = buildClassName(variant, fullWidth, false);
  // The click event is not passed on: the handler takes no arguments.
  const handleClick = onClick === undefined ? undefined : () => onClick();
  const content = (
    <>
      {icon}
      {children}
    </>
  );

  return target.to === undefined ? (
    <a href={target.href} className={className} onClick={handleClick}>
      {content}
    </a>
  ) : (
    <Link to={target.to} className={className} onClick={handleClick}>
      {content}
    </Link>
  );
}
