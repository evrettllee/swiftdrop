// The longest text each varchar column takes. The database schema and the request validation both
// read these values, so a request that passes validation always fits its column.

export const ADDRESS_FIELD_LENGTH = {
  LABEL: 100,
  CITY: 100,
  STREET: 150,
  HOUSE: 20,
  APARTMENT: 20,
} as const;

// A person as the users table keeps them.
export const PERSON_FIELD_LENGTH = {
  // The first name and the last name have the same limit.
  NAME: 100,
  EMAIL: 255,
  PASSWORD_HASH: 255,
  // The column is wider than validation lets through (up to 15 digits and a "+", see
  // PHONE_MAX_DIGITS). The spare room is kept so that no migration is needed.
  PHONE: 32,
} as const;

export const OAUTH_ACCOUNT_FIELD_LENGTH = {
  PROVIDER_USER_ID: 255,
} as const;

export const ROLE_FIELD_LENGTH = {
  NAME: 50,
} as const;

// Refresh, password reset and email verification tokens are kept as hashes of the same length.
export const TOKEN_FIELD_LENGTH = {
  HASH: 64,
} as const;

export const COURIER_PROFILE_FIELD_LENGTH = {
  AVATAR_URL: 500,
} as const;

export const VEHICLE_FIELD_LENGTH = {
  BRAND: 100,
  MODEL: 100,
  LICENSE_PLATE: 20,
} as const;

export const TARIFF_FIELD_LENGTH = {
  NAME: 100,
} as const;

export const SERVICE_ZONE_FIELD_LENGTH = {
  NAME: 100,
} as const;

export const ORDER_FIELD_LENGTH = {
  OTP_CODE: 4,
  // The column is wider than the name validation lets through (PERSON_FIELD_LENGTH.NAME). The
  // spare room is kept so that no migration is needed.
  RECIPIENT_NAME: 150,
} as const;

export const PAYMENT_FIELD_LENGTH = {
  CHECKOUT_SESSION_ID: 255,
  STRIPE_PAYMENT_ID: 255,
} as const;

export const SUPPORT_TICKET_FIELD_LENGTH = {
  SUBJECT: 255,
} as const;

export const MESSAGE_FIELD_LENGTH = {
  ATTACHMENT_URL: 500,
} as const;
