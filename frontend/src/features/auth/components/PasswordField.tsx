import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants';
import { Input, type InputProps } from '../../../shared/ui/Input';
import { AUTH_TEXTS } from '../constants';

type PasswordFieldProps = Omit<InputProps, 'type' | 'endAdornment'>;

// Password input with a button that toggles the visibility of the typed text.
export function PasswordField(props: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ToggleIcon = isVisible ? EyeSlashIcon : EyeIcon;
  const toggleLabel = isVisible ? AUTH_TEXTS.HIDE_PASSWORD : AUTH_TEXTS.SHOW_PASSWORD;

  const toggle = (
    <button
      type="button"
      disabled={props.disabled}
      aria-label={toggleLabel}
      onClick={() => setIsVisible((current) => !current)}
      className="flex size-11 items-center justify-center rounded-sm text-fg-secondary transition-colors duration-150 hover:text-fg disabled:text-fg-muted motion-reduce:transition-none"
    >
      <ToggleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
    </button>
  );

  return <Input {...props} type={isVisible ? 'text' : 'password'} endAdornment={toggle} />;
}
