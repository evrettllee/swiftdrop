import { ApiError, HTTP_STATUS } from '@/shared/api';
import { TARIFF_FIELD, type TariffField } from '../config/limits';
import { EDIT_TEXTS, OFF_TEXTS } from '../config/texts';
import type { TariffErrors } from './tariff-form';

const KNOWN_FIELDS: ReadonlySet<string> = new Set(Object.values(TARIFF_FIELD));
const NAME_TAKEN = 'Тариф с таким названием уже есть';
const REASON_SEPARATOR = ': ';

function isField(field: string): field is TariffField {
  return KNOWN_FIELDS.has(field);
}

export function fieldErrorsOf(error: unknown): TariffErrors | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  if (error.status === HTTP_STATUS.CONFLICT && error.message === NAME_TAKEN) {
    return { [TARIFF_FIELD.NAME]: error.message };
  }

  if (error.status !== HTTP_STATUS.BAD_REQUEST) {
    return null;
  }

  const errors: TariffErrors = {};

  for (const { field, message } of error.fieldErrors) {
    if (isField(field) && errors[field] === undefined) {
      errors[field] = message;
    }
  }

  return Object.keys(errors).length === 0 ? null : errors;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type ErrorCard = { title: string; text: string };

export function toastErrorOf(error: unknown, fallbackTitle: string, fallback: string): ErrorCard {
  if (!(error instanceof ApiError)) {
    return { title: fallbackTitle, text: fallback };
  }

  const split = error.message.indexOf(REASON_SEPARATOR);

  return split === -1
    ? { title: error.message, text: '' }
    : {
        title: error.message.slice(0, split),
        text: capitalize(error.message.slice(split + REASON_SEPARATOR.length)),
      };
}

export function offError(error: unknown): ErrorCard {
  return toastErrorOf(error, OFF_TEXTS.FAILED_TITLE, OFF_TEXTS.FAILED);
}

export function saveError(error: unknown): ErrorCard {
  return toastErrorOf(error, EDIT_TEXTS.FAILED_TITLE, EDIT_TEXTS.FAILED);
}
