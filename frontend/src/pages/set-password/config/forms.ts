export const SET_PASSWORD_FIELD = {
  PASSWORD: 'password',
  CONFIRM_PASSWORD: 'confirmPassword',
} as const;

export const SET_PASSWORD_INITIAL_VALUES = {
  [SET_PASSWORD_FIELD.PASSWORD]: '',
  [SET_PASSWORD_FIELD.CONFIRM_PASSWORD]: '',
};
