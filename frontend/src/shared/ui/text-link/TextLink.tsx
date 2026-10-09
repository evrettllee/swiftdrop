import { Link, type LinkProps } from 'react-router';

type TextLinkVariant = 'inline' | 'standalone';

const VARIANT_CLASSES: Record<TextLinkVariant, string> = {
  // Inside running text: always underlined.
  inline: 'rounded-sm font-semibold text-accent underline',
  // On its own line under a field: a 44px tap target that does not add height to the layout.
  standalone:
    '-my-3 -me-1 inline-flex min-h-11 items-center rounded-sm px-1 text-small font-semibold text-accent hover:underline',
};

type TextLinkProps = Omit<LinkProps, 'className'> & {
  variant?: TextLinkVariant;
};

export function TextLink({ variant = 'inline', ...props }: TextLinkProps) {
  return <Link className={VARIANT_CLASSES[variant]} {...props} />;
}
