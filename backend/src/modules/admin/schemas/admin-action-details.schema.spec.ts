import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { parseActionDetails } from './admin-action-details.schema';

describe('parseActionDetails', () => {
  it.each([
    [ADMIN_ACTION.USER_BLOCKED, { reason: 'Жалобы клиентов' }],
    [ADMIN_ACTION.ROLE_CHANGED, { from: 'courier', to: 'manager' }],
    [ADMIN_ACTION.USER_UPDATED, { fields: ['firstName', 'phone'] }],
    [ADMIN_ACTION.STAFF_INVITED, { role: 'courier' }],
    [ADMIN_ACTION.STAFF_INVITED, { role: 'manager' }],
    [ADMIN_ACTION.INVITE_RESENT, {}],
    [ADMIN_ACTION.SESSIONS_ENDED, {}],
  ])('should keep the details of %s when they have the expected shape', (action, details) => {
    expect(parseActionDetails(action, details)).toEqual(details);
  });

  it.each([
    [ADMIN_ACTION.USER_BLOCKED, { reason: 42 }],
    [ADMIN_ACTION.ROLE_CHANGED, { from: 'admin', to: 'manager' }],
    [ADMIN_ACTION.ROLE_CHANGED, { from: 'client', to: 'courier' }],
    [ADMIN_ACTION.STAFF_INVITED, null],
    [ADMIN_ACTION.USER_UPDATED, { changes: { phone: { from: '+375291111111', to: null } } }],
    [ADMIN_ACTION.USER_UPDATED, { fields: ['email'] }],
    [ADMIN_ACTION.STAFF_INVITED, { role: 'admin' }],
  ])('should give empty details for %s when the stored shape is unknown', (action, details) => {
    expect(parseActionDetails(action, details)).toEqual({});
  });

  it('should drop extra keys when the details hold more than the shape', () => {
    expect(
      parseActionDetails(ADMIN_ACTION.PASSWORD_RESET, { token: 'secret', link: 'https://x' }),
    ).toEqual({});
  });

  it('should keep only the field names when the update details also hold values', () => {
    expect(
      parseActionDetails(ADMIN_ACTION.USER_UPDATED, {
        fields: ['phone'],
        from: '+375291111111',
        to: '+375292222222',
      }),
    ).toEqual({ fields: ['phone'] });
  });

  it('should give empty details for an action without a user shape', () => {
    expect(parseActionDetails(ADMIN_ACTION.STAFF_PURGED, { name: 'Стандарт' })).toEqual({});
  });
});
