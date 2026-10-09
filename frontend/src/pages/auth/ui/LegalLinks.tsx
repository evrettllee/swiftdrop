import { APP_ROUTES } from '@/shared/routes';
import { TextLink } from '@/shared/ui/text-link';
import { AUTH_TEXTS } from '../config/texts';

// "Terms of use and privacy policy": both open in a new tab, so a half-filled form is not lost.
export function LegalLinks() {
  return (
    <>
      <TextLink to={APP_ROUTES.TERMS} target="_blank" rel="noreferrer">
        {AUTH_TEXTS.TERMS_LINK}
      </TextLink>{' '}
      {AUTH_TEXTS.AND}{' '}
      <TextLink to={APP_ROUTES.PRIVACY} target="_blank" rel="noreferrer">
        {AUTH_TEXTS.PRIVACY_LINK}
      </TextLink>
    </>
  );
}
