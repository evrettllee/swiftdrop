import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Link } from 'react-router';
import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { Spinner } from '@/shared/ui/spinner';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'inverse' | 'danger';

const BASE_CLASS = `relative inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-md px-4 py-2 text-body font-semibold ${COLOR_TRANSITION_CLASS}`;

// A loading button is disabled too, but keeps the look of its variant (design system §8): the
// disabled look applies only while the button is not busy.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary shadow-sm hover:bg-primary-hover active:bg-primary-pressed disabled:not-aria-busy:bg-border disabled:not-aria-busy:text-fg-muted disabled:not-aria-busy:shadow-none dark:disabled:not-aria-busy:border dark:disabled:not-aria-busy:border-border dark:disabled:not-aria-busy:bg-surface-muted',
  secondary:
    'border border-border-button bg-surface text-accent shadow-sm hover:bg-selected active:bg-border disabled:not-aria-busy:border-transparent disabled:not-aria-busy:bg-border disabled:not-aria-busy:text-fg-muted disabled:not-aria-busy:shadow-none dark:disabled:not-aria-busy:border-border dark:disabled:not-aria-busy:bg-surface-muted',
  text: 'text-accent hover:bg-selected active:bg-border disabled:not-aria-busy:bg-border disabled:not-aria-busy:text-fg-muted dark:disabled:not-aria-busy:bg-surface-muted',
  // A light button for a block filled with the primary color.
  inverse:
    'bg-inverse text-on-inverse hover:opacity-90 active:opacity-80 disabled:not-aria-busy:opacity-50',
  // A destructive action, for example cancelling an order.
  danger:
    'bg-danger-solid text-on-primary shadow-sm hover:bg-danger-solid-hover active:bg-danger-solid-pressed disabled:not-aria-busy:bg-border disabled:not-aria-busy:text-fg-muted disabled:not-aria-busy:shadow-none dark:disabled:not-aria-busy:border dark:disabled:not-aria-busy:border-border dark:disabled:not-aria-busy:bg-surface-muted',
};

const SOLID_VARIANTS: ReadonlySet<ButtonVariant> = new Set(['primary', 'danger']);

// The text and the icons of a button, laid out as the button lays them out.
const CONTENT_CLASS = 'inline-flex items-center justify-center gap-1';

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
    // A disabled button still takes the hover of its variant: none while it is busy.
    isLoading ? 'pointer-events-none' : '',
  );
}

// `ref` reaches the <button>, for example to focus it.
type ButtonProps = CommonProps & { loading?: boolean; ref?: Ref<HTMLButtonElement> } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children'
  >;

// While loading, the text and the icons stay where they are, only unseen, so the button keeps its
// size and a screen reader still reads its name; the spinner stands in the middle of the button.
export function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={buildClassName(variant, fullWidth, loading)}
      {...rest}
    >
      <span className={joinClassNames(CONTENT_CLASS, loading ? 'opacity-0' : '')}>
        {icon}
        {children}
      </span>
      {loading ? (
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <Spinner tone={SOLID_VARIANTS.has(variant) ? 'on-primary' : 'accent'} />
        </span>
      ) : null}
    </button>
  );
}

type LinkButtonProps = CommonProps & {
  // Runs before the navigation, for example to remember what the next page needs.
  onClick?: () => void;
  // The name for screen readers when the text alone does not say enough, for example whom to call.
  label?: string;
} & (
    | {
        href: string;
        to?: never;
        // Opens in a new tab, so the current page keeps working.
        isExternal?: boolean;
      }
    | { to: string; href?: never; isExternal?: never }
  );

// A link that looks like a button: `to` for pages of the app, `href` for full-page navigation.
export function LinkButton({
  variant = 'primary',
  fullWidth = false,
  icon,
  onClick,
  label,
  isExternal = false,
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
    <a
      href={target.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      aria-label={label}
      className={className}
      onClick={handleClick}
    >
      {content}
    </a>
  ) : (
    <Link to={target.to} aria-label={label} className={className} onClick={handleClick}>
      {content}
    </Link>
  );
}
