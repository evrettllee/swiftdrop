const ENCODED_FILENAME = /filename\*\s*=\s*UTF-8''([^;]+)/i;
const QUOTED_FILENAME = /filename\s*=\s*"([^"]*)"/i;
const PLAIN_FILENAME = /filename\s*=\s*([^;"\s]+)/i;
const UNSAFE_FILENAME_CHARACTERS = /[\\/:*?"<>|\p{Cc}]/gu;

function decode(value: string): string | null {
  try {
    return decodeURIComponent(value.trim());
  } catch {
    return null;
  }
}

function clean(name: string | null | undefined): string | null {
  const safe = name?.replace(UNSAFE_FILENAME_CHARACTERS, '').trim() ?? '';

  return safe === '' ? null : safe;
}

export function readAttachmentFilename(header: string | null): string | null {
  if (header === null) {
    return null;
  }

  const encoded = ENCODED_FILENAME.exec(header)?.[1];
  const fromEncoded = encoded === undefined ? null : clean(decode(encoded));

  return (
    fromEncoded ??
    clean(QUOTED_FILENAME.exec(header)?.[1]) ??
    clean(PLAIN_FILENAME.exec(header)?.[1])
  );
}
