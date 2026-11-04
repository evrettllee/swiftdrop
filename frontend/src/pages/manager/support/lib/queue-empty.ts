import { SEARCH_KIND, searchKindOf } from '@/shared/staff-api';
import { SUPPORT_VIEW, type SupportView } from '@/shared/support-api';
import { EMPTY_TEXTS, MANAGER_SUPPORT_TEXTS as TEXTS } from '../config/texts';

export type QueueEmpty = { title: string; text: string };

export function queueEmpty(view: SupportView, search: string | null, hasRole: boolean): QueueEmpty {
  if (search !== null) {
    const isNumber = searchKindOf(search) === SEARCH_KIND.NUMBER;
    const subject = isNumber ? EMPTY_TEXTS.byNumber(search) : EMPTY_TEXTS.byText(search);
    const advice = isNumber ? EMPTY_TEXTS.CHECK_NUMBER : EMPTY_TEXTS.CHECK_TEXT;

    return { title: TEXTS.NOTHING_TITLE, text: `${subject}${EMPTY_TEXTS.NONE}${advice}` };
  }

  if (hasRole) {
    return {
      title: TEXTS.NOTHING_TITLE,
      text: `${EMPTY_TEXTS.BY_FILTERS}${EMPTY_TEXTS.NONE}${EMPTY_TEXTS.CHANGE_FILTERS}`,
    };
  }

  return view === SUPPORT_VIEW.AWAITING
    ? { title: TEXTS.QUEUE_EMPTY_TITLE, text: TEXTS.QUEUE_EMPTY_TEXT }
    : { title: TEXTS.TAB_EMPTY_TITLE, text: TEXTS.TAB_EMPTY_TEXT };
}
