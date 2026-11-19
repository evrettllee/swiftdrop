import { parseUserSearch } from './user-search';

describe('parseUserSearch', () => {
  it.each(['+375 (29) 123-45-67', '80291234567', '291234567', '375291234567'])(
    'should search the normalized phone when the query is the phone %s',
    (query) => {
      expect(parseUserSearch(query)).toEqual({ kind: 'phone', phone: '+375291234567' });
    },
  );

  it('should search an impossible phone as nothing when there are 7 digits that are no phone', () => {
    expect(parseUserSearch('1234567')).toEqual({ kind: 'phone', phone: null });
  });

  it('should search text when the query has fewer than 7 digits', () => {
    expect(parseUserSearch('123456')).toEqual({ kind: 'text', pattern: '%123456%' });
  });

  it('should escape LIKE wildcards when the query is text', () => {
    expect(parseUserSearch('50%_off\\')).toEqual({ kind: 'text', pattern: '%50\\%\\_off\\\\%' });
  });

  it('should search text when the digits come with letters', () => {
    expect(parseUserSearch('ivan1234567')).toEqual({ kind: 'text', pattern: '%ivan1234567%' });
  });
});
