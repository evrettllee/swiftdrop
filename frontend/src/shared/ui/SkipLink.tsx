import { MAIN_CONTENT_ID } from '../constants/dom';
import { UI_TEXTS } from '../constants/texts';

// The first focusable element of a page: hidden until it gets focus from the keyboard.
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-primary focus:px-4 focus:py-2.5 focus:text-body focus:font-semibold focus:text-on-primary"
    >
      {UI_TEXTS.SKIP_TO_CONTENT}
    </a>
  );
}
