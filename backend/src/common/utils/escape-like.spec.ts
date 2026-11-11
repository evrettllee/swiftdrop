import { escapeLike } from './escape-like';

describe('escapeLike', () => {
  it.each([
    ['100%', '100\\%'],
    ['a_b', 'a\\_b'],
    ['back\\slash', 'back\\\\slash'],
    ['%_\\', '\\%\\_\\\\'],
    ['Минск, ул. Ленина', 'Минск, ул. Ленина'],
    ['', ''],
  ])('should escape %j as %j', (text, escaped) => {
    expect(escapeLike(text)).toBe(escaped);
  });
});
