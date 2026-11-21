import type { Icon } from '@phosphor-icons/react';
import type { HistoryEntry, PersonName } from '../api/admin-user-card';
import {
  FIELD_NAMES,
  HISTORY_ACTION,
  HISTORY_DETAIL_TEXTS as DETAILS,
  HISTORY_ICONS,
  HISTORY_TITLES,
  type HistoryAction,
  ROLE_NAMES,
} from '../config/history';
import { formatDateTime } from './date-time';

export type HistoryRow = { title: string; details: string | null; meta: string; icon: Icon };

const KNOWN_ACTIONS: ReadonlySet<string> = new Set(Object.values(HISTORY_ACTION));

function isKnown(action: string): action is HistoryAction {
  return KNOWN_ACTIONS.has(action);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function personShort({ firstName, lastName }: PersonName): string {
  const initial = lastName.charAt(0);

  return initial === '' ? firstName : `${firstName} ${initial}.`;
}

function detailsOf(action: HistoryAction, details: HistoryEntry['details']): string | null {
  switch (action) {
    case HISTORY_ACTION.STAFF_INVITED:
      return details.role === undefined ? null : DETAILS.role(ROLE_NAMES[details.role]);
    case HISTORY_ACTION.USER_UPDATED: {
      const names = (details.fields ?? []).map((field) => FIELD_NAMES[field] ?? field);

      return names.length === 0 ? null : capitalize(names.join(', '));
    }
    case HISTORY_ACTION.ROLE_CHANGED:
      return details.from === undefined || details.to === undefined
        ? null
        : capitalize(DETAILS.roleChange(ROLE_NAMES[details.from], ROLE_NAMES[details.to]));
    case HISTORY_ACTION.PASSWORD_RESET:
      return DETAILS.PASSWORD_RESET;
    case HISTORY_ACTION.USER_BLOCKED:
      return details.reason === undefined || details.reason === ''
        ? null
        : DETAILS.reason(details.reason);
    case HISTORY_ACTION.USER_DELETED:
      return DETAILS.USER_DELETED;
    default:
      return null;
  }
}

export function historyView(entry: HistoryEntry): HistoryRow | null {
  if (!isKnown(entry.action)) {
    return null;
  }

  return {
    title: HISTORY_TITLES[entry.action],
    details: detailsOf(entry.action, entry.details),
    meta: `${formatDateTime(entry.at)} · ${personShort(entry.actor)}`,
    icon: HISTORY_ICONS[entry.action],
  };
}
