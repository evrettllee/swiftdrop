import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants/styles';
import { Input, type InputProps } from '../../../shared/ui/Input';
import { AUTH_TEXTS } from '../constants/texts';

type PasswordFieldProps = Omit<InputProps, 'type' | 'endAdornment'>;

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
      className={`flex size-11 items-center justify-center rounded-sm text-fg-secondary hover:text-fg disabled:text-fg-muted ${COLOR_TRANSITION_CLASS}`}
    >
      <ToggleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
    </button>
  );

  return <Input {...props} type={isVisible ? 'text' : 'password'} endAdornment={toggle} />;
}
