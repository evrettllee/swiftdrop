import { ADMIN_STAFF_MESSAGES } from '../constants/admin-staff.constants';
import { inviteStaffSchema, updateStaffSchema } from './admin-staff.dto';

const VALID_INVITE = {
  role: 'courier',
  firstName: ' Павел ',
  lastName: 'Орлов',
  email: ' Pavel.Orlov@Example.COM ',
  phone: '+375 (29) 111-22-33',
};

function issuesOf(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
}

describe('inviteStaffSchema', () => {
  it('should trim the names, lowercase the email and normalize the phone when the body is valid', () => {
    expect(inviteStaffSchema.parse(VALID_INVITE)).toEqual({
      role: 'courier',
      firstName: 'Павел',
      lastName: 'Орлов',
      email: 'pavel.orlov@example.com',
      phone: '+375291112233',
    });
  });

  it.each(['admin', 'client', 'boss'])('should reject the role %s', (role) => {
    const result = inviteStaffSchema.safeParse({ ...VALID_INVITE, role });

    expect(issuesOf(result)).toEqual(['role']);
    expect(result.error?.issues[0].message).toBe(ADMIN_STAFF_MESSAGES.ROLE_INVALID);
  });

  it('should reject an unknown key when the body holds more than the fields', () => {
    const result = inviteStaffSchema.safeParse({ ...VALID_INVITE, passwordHash: 'x' });

    expect(result.success).toBe(false);
  });

  it('should name every wrong field when the email, the name and the phone are wrong', () => {
    const result = inviteStaffSchema.safeParse({
      ...VALID_INVITE,
      firstName: 'П',
      email: 'not-an-email',
      phone: '123',
    });

    expect(issuesOf(result).toSorted((first, second) => first.localeCompare(second))).toEqual([
      'email',
      'firstName',
      'phone',
    ]);
  });

  it('should require every field when the body is empty', () => {
    expect(issuesOf(inviteStaffSchema.safeParse({}))).toHaveLength(5);
  });
});

describe('updateStaffSchema', () => {
  it('should keep only the given fields when part of the data changes', () => {
    expect(updateStaffSchema.parse({ lastName: ' Белова ', phone: '+375 29 111-22-33' })).toEqual({
      lastName: 'Белова',
      phone: '+375291112233',
    });
  });

  it('should reject an empty body', () => {
    const result = updateStaffSchema.safeParse({});

    expect(result.error?.issues[0].message).toBe(ADMIN_STAFF_MESSAGES.NOTHING_TO_UPDATE);
  });

  it.each([{ email: 'new@example.com' }, { firstName: 'Анна', role: 'manager' }])(
    'should reject a key that cannot be edited: %o',
    (body) => {
      expect(updateStaffSchema.safeParse(body).success).toBe(false);
    },
  );

  it('should reject an invalid name when it is given', () => {
    expect(issuesOf(updateStaffSchema.safeParse({ firstName: '1' }))).toEqual(['firstName']);
  });
});
