import { CHECKBOX_UNCHECKED_VALUE } from '../../../shared/constants/forms';

// The fields that are sent to the backend have the names of the API body.
export const AUTH_FIELD = {
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  EMAIL: 'email',
  PHONE: 'phone',
  PASSWORD: 'password',
  CONFIRM_PASSWORD: 'confirmPassword',
  TERMS: 'terms',
} as const;

// Initial values of the forms; every value is a string, a checkbox is '' or 'true'.
export const LOGIN_INITIAL_VALUES = {
  [AUTH_FIELD.EMAIL]: '',
  [AUTH_FIELD.PASSWORD]: '',
};

export const REGISTER_INITIAL_VALUES = {
  [AUTH_FIELD.FIRST_NAME]: '',
  [AUTH_FIELD.LAST_NAME]: '',
  [AUTH_FIELD.EMAIL]: '',
  [AUTH_FIELD.PHONE]: '',
  [AUTH_FIELD.PASSWORD]: '',
  [AUTH_FIELD.CONFIRM_PASSWORD]: '',
  [AUTH_FIELD.TERMS]: CHECKBOX_UNCHECKED_VALUE,
};
