import { firstGraphemes, fullPersonName, shortPersonName } from './person-name';

describe('shortPersonName', () => {
  it('should keep the first name and the initial of the last name', () => {
    expect(shortPersonName('Дмитрий', 'Соколов')).toBe('Дмитрий С.');
  });

  it('should keep a whole letter with its mark as the initial', () => {
    expect(shortPersonName('Анна', 'Ёлкина')).toBe('Анна Ё.');
  });

  it('should give only the first name when the last name is empty', () => {
    expect(shortPersonName('Удалённый пользователь', '')).toBe('Удалённый пользователь');
  });
});

describe('fullPersonName', () => {
  it('should join the first and the last name', () => {
    expect(fullPersonName('Дмитрий', 'Соколов')).toBe('Дмитрий Соколов');
  });

  it('should give only the first name when the last name is empty', () => {
    expect(fullPersonName('Удалённый пользователь', '')).toBe('Удалённый пользователь');
  });
});

describe('firstGraphemes', () => {
  it('should cut by letters as the reader sees them', () => {
    expect(firstGraphemes('👩‍💻 code', 2)).toBe('👩‍💻 ');
  });
});
