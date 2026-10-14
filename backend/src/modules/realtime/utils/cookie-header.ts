import {
  COOKIE_NAME_VALUE_SEPARATOR,
  COOKIE_PAIR_SEPARATOR,
} from '../constants/realtime.constants';

function decodeValue(value: string): string {
  let decoded = value;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    // A malformed escape is kept as it came: such a value simply fails the token check later.
    decoded = value;
  }

  return decoded;
}

// A socket handshake has the raw Cookie header only: cookie-parser does not run there.
export function parseCookieHeader(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};

  for (const part of (header ?? '').split(COOKIE_PAIR_SEPARATOR)) {
    const separatorIndex = part.indexOf(COOKIE_NAME_VALUE_SEPARATOR);

    if (separatorIndex > 0) {
      const name = part.slice(0, separatorIndex).trim();
      cookies[name] = decodeValue(part.slice(separatorIndex + 1).trim());
    }
  }

  return cookies;
}
