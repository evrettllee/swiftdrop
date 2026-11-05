import { firstGraphemes, shortPersonName } from './person-name';

describe('shortPersonName', () => {
  it('should keep the first name and the initial of the last name', () => {
    expect(shortPersonName('Дмитрий', 'Соколов')).toBe('Дмитрий С.');
  });

  it('should keep a whole letter with its mark as the initial', () => {
    expect(shortPersonName('Анна', 'Ёлкина')).toBe('Анна Ё.');
  });
});

describe('firstGraphemes', () => {
  it('should cut by letters as the reader sees them', () => {
    expect(firstGraphemes('👩‍💻 code', 2)).toBe('👩‍💻 ');
  });
});
