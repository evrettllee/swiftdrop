import { ClockIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { SET_PASSWORD_TEXTS } from '../config/texts';

export function InvalidLink() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <ClockIcon
        size={ICON_SIZE.XLARGE}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="text-fg-secondary"
      />
      <div className="flex flex-col gap-4.5">
        <h1 className="text-heading-md font-semibold text-balance">
          {SET_PASSWORD_TEXTS.INVALID_TITLE}
        </h1>
        <p className="lg:max-w-75 self-center text-body text-pretty text-fg-secondary">
          {SET_PASSWORD_TEXTS.INVALID_TEXT}
        </p>
      </div>
      <div className="w-full pt-2">
        <LinkButton to={APP_ROUTES.AUTH} fullWidth>
          {SET_PASSWORD_TEXTS.INVALID_ACTION}
        </LinkButton>
      </div>
    </div>
  );
}
