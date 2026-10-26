import type { AnchorHTMLAttributes, ButtonHTMLAttributes, Ref } from 'react';
import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';

const OUTLINE_CLASS = `relative flex size-11 shrink-0 items-center justify-center rounded-md border border-border-button bg-surface text-accent shadow-sm hover:bg-selected active:bg-border ${COLOR_TRANSITION_CLASS}`;

type OutlineIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
};

export function OutlineIconButton({ type = 'button', className, ...rest }: OutlineIconButtonProps) {
  return (
    <button type={type} className={joinClassNames(OUTLINE_CLASS, className ?? '')} {...rest} />
  );
}

type OutlineIconLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function OutlineIconLink({ className, ...rest }: OutlineIconLinkProps) {
  return <a className={joinClassNames(OUTLINE_CLASS, className ?? '')} {...rest} />;
}
