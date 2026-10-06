import { AUTH_VALIDATION_MESSAGES, NAME_MAX_LENGTH } from '../constants/validation';
import { registerSchema } from './register.dto';

const VALID_DATA = {
  firstName: 'Иван',
  lastName: 'Петров',
  email: 'ivan@example.com',
  phone: '+375291234567',
  password: 'Test1234!',
};

const VALID_NAMES = [
  'Анна-Мария',
  "О'Брайен",
  'О’Брайен',
  'Jean Paul',
  'Ёлкин',
  // Ё written as Е plus a combining diaeresis.
  'Ёлкин',
  'José',
  'Nguyễn',
  'Mary Ann Smith-Jones',
];

const INVALID_NAMES = [
  'Иван123',
  '-Иван',
  'Иван-',
  'Иван--Петров',
  'Иван  Петров',
  'Иван!',
  '<b>Иван</b>',
  '😀Иван',
  'Иван_Петров',
];

function nameIssues(field: 'firstName' | 'lastName', value: string) {
  const result = registerSchema.safeParse({ ...VALID_DATA, [field]: value });

  return result.success ? [] : result.error.issues.filter((issue) => issue.path[0] === field);
}

describe('registerSchema names', () => {
  it.each(VALID_NAMES)('should accept %s as a first and a last name', (name) => {
    expect(nameIssues('firstName', name)).toEqual([]);
    expect(nameIssues('lastName', name)).toEqual([]);
  });

  it.each(INVALID_NAMES)('should reject %s with one pattern message per field', (name) => {
    expect(nameIssues('firstName', name).map((issue) => issue.message)).toEqual([
      AUTH_VALIDATION_MESSAGES.FIRST_NAME_INVALID,
    ]);
    expect(nameIssues('lastName', name).map((issue) => issue.message)).toEqual([
      AUTH_VALIDATION_MESSAGES.LAST_NAME_INVALID,
    ]);
  });

  it('should trim the spaces around the name before checking and saving it', () => {
    const result = registerSchema.parse({ ...VALID_DATA, firstName: '  Анна-Мария  ' });

    expect(result.firstName).toBe('Анна-Мария');
  });

  it('should give only the length message when the name is too short and has bad symbols', () => {
    expect(nameIssues('firstName', ' 1 ').map((issue) => issue.message)).toEqual([
      AUTH_VALIDATION_MESSAGES.FIRST_NAME_TOO_SHORT,
    ]);
  });

  it('should give only the length message when the name is too long', () => {
    expect(
      nameIssues('lastName', 'Я'.repeat(NAME_MAX_LENGTH + 1)).map((issue) => issue.message),
    ).toEqual([AUTH_VALIDATION_MESSAGES.LAST_NAME_TOO_LONG]);
  });
});
