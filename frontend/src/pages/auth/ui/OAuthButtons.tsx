import { ICON_SIZE } from '@/shared/config';
import { LinkButton } from '@/shared/ui/button';
import {
  GOOGLE_BRAND_COLORS,
  OAUTH_START_URLS,
  YANDEX_BRAND_COLOR,
  YANDEX_MARK_LETTER,
  YANDEX_MARK_TEXT_COLOR,
} from '../config/oauth';
import { AUTH_TEXTS } from '../config/texts';
import { LegalLinks } from './LegalLinks';

type OAuthButtonsProps = {
  // The consent note is shown on registration only.
  showConsent?: boolean;
};

function GoogleMark() {
  return (
    <svg
      width={ICON_SIZE.MEDIUM}
      height={ICON_SIZE.MEDIUM}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="me-1"
    >
      <path
        fill={GOOGLE_BRAND_COLORS.BLUE}
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill={GOOGLE_BRAND_COLORS.GREEN}
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill={GOOGLE_BRAND_COLORS.YELLOW}
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill={GOOGLE_BRAND_COLORS.RED}
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

function YandexMark() {
  return (
    <span
      aria-hidden="true"
      className="me-1 flex size-5 items-center justify-center rounded-full text-small leading-none font-bold"
      style={{ backgroundColor: YANDEX_BRAND_COLOR, color: YANDEX_MARK_TEXT_COLOR }}
    >
      {YANDEX_MARK_LETTER}
    </span>
  );
}

export function OAuthButtons({ showConsent = false }: OAuthButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      <LinkButton
        variant="secondary"
        fullWidth
        href={OAUTH_START_URLS.google}
        icon={<GoogleMark />}
      >
        {AUTH_TEXTS.OAUTH_GOOGLE}
      </LinkButton>
      <LinkButton
        variant="secondary"
        fullWidth
        href={OAUTH_START_URLS.yandex}
        icon={<YandexMark />}
      >
        {AUTH_TEXTS.OAUTH_YANDEX}
      </LinkButton>
      {showConsent ? (
        <p className="text-small text-fg-secondary">
          {AUTH_TEXTS.OAUTH_CONSENT} <LegalLinks />
        </p>
      ) : null}
    </div>
  );
}
