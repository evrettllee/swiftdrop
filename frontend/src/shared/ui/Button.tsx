import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

const BASE_CLASS =
  'inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-md px-4 py-2.5 text-body font-semibold transition-colors duration-150 ease-in-out motion-reduce:transition-none';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary shadow-sm hover:bg-primary-hover active:bg-primary-pressed disabled:bg-border disabled:text-fg-muted disabled:shadow-none dark:disabled:border dark:disabled:border-border dark:disabled:bg-surface-muted',
  secondary:
    'border border-border-button bg-surface text-accent shadow-sm hover:bg-selected active:bg-border disabled:border-transparent disabled:bg-border disabled:text-fg-muted disabled:shadow-none dark:disabled:border-border dark:disabled:bg-surface-muted',
  text: 'text-accent hover:bg-selected active:bg-border disabled:bg-border disabled:text-fg-muted dark:disabled:bg-surface-muted',
};

type CommonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
};

function buildClassName(variant: ButtonVariant, fullWidth: boolean, isLoading: boolean): string {
  return [
    BASE_CLASS,
    VARIANT_CLASSES[variant],
    fullWidth ? 'w-full' : '',
    isLoading ? 'pointer-events-none' : '',
  ]
    .filter(Boolean)
    .join(' ');
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
          <Spinner tone={variant === 'primary' ? 'on-primary' : 'accent'} />
        </span>
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps & ({ href: string; to?: never } | { to: string; href?: never });

// A link that looks like a button: `to` for pages of the app, `href` for full-page navigation.
export function LinkButton({
  variant = 'primary',
  fullWidth = false,
  icon,
  children,
  ...target
}: LinkButtonProps) {
  const className = buildClassName(variant, fullWidth, false);
  const content = (
    <>
      {icon}
      {children}
    </>
  );

  return target.to === undefined ? (
    <a href={target.href} className={className}>
      {content}
    </a>
  ) : (
    <Link to={target.to} className={className}>
      {content}
    </Link>
  );
}
