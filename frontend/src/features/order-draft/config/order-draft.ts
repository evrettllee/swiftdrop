import {
  ADDRESS_TEXT_MAX_LENGTH,
  APARTMENT_MAX_LENGTH,
  PACKAGE_VALUE_MAX_LENGTH,
} from '@/shared/config';
import { FULL_NAME_MAX_LENGTH, PHONE_INPUT_MAX_LENGTH } from '@/shared/lib/person-validation';

// The draft lives in sessionStorage: it survives the sign-in (and the return from an OAuth
// provider) in the same tab and is gone with the tab.
export const ORDER_DRAFT_STORAGE_KEY = 'swiftdrop-order-draft';

// Protective limits of the stored strings: the storage is under the user's control, so a value past
// them is not a draft written by the app, and the whole draft is dropped. Each limit is at least
// what its field can hold, so a draft saved by the order form is never dropped.
export const ORDER_DRAFT_MAX_LENGTH = {
  // The address text and its parts (the city, the street and the house).
  ADDRESS: ADDRESS_TEXT_MAX_LENGTH,
  PACKAGE_VALUE: PACKAGE_VALUE_MAX_LENGTH,
  APARTMENT: APARTMENT_MAX_LENGTH,
  // The recipient starts as the full name of the profile, longer than the name field takes.
  RECIPIENT_NAME: FULL_NAME_MAX_LENGTH,
  RECIPIENT_PHONE: PHONE_INPUT_MAX_LENGTH,
} as const;
