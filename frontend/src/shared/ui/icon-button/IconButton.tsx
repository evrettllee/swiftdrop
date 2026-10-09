import type { ButtonHTMLAttributes } from 'react';
import { joinClassNames } from '@/shared/lib/class-names';

const BASE_CLASS =
  'flex size-11 items-center justify-center rounded-md text-fg transition-colors duration-150 hover:bg-selected';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

// A button with only an icon inside: the caller must give it a name with `aria-label`.
export function IconButton({ type = 'button', className, ...rest }: IconButtonProps) {
  return <button type={type} className={joinClassNames(BASE_CLASS, className ?? '')} {...rest} />;
}
