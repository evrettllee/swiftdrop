export function keepUnchangedItems<T>(
  previous: T[],
  next: T[],
  idOf: (item: T) => number | string,
): T[] {
  if (previous.length === 0) {
    return next;
  }

  const known = new Map(previous.map((item) => [idOf(item), item]));
  let isSame = previous.length === next.length;
  const kept = next.map((item, index) => {
    const old = known.get(idOf(item));
    const result = old !== undefined && JSON.stringify(old) === JSON.stringify(item) ? old : item;
    isSame &&= result === previous[index];

    return result;
  });

  return isSame ? previous : kept;
}
