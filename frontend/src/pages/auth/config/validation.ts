import { EMAIL_EXAMPLE, PERSON_VALIDATION_MESSAGES } from '@/shared/lib/person-validation';

// Validation limits: must match backend/src/auth/constants/validation.ts
// Name and phone limits live in shared/lib/person-validation/person-validation.ts
export { EMAIL_EXAMPLE };

export const VALIDATION_MESSAGES = {
  ...PERSON_VALIDATION_MESSAGES,
  PASSWORD_REQUIRED: 'Введите пароль',
  TERMS_REQUIRED: 'Подтвердите согласие, чтобы создать аккаунт',
} as const;
