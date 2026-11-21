export function formatShortPersonName(firstName: string, lastName: string): string {
  const initial = lastName.charAt(0);

  return initial === '' ? firstName : `${firstName} ${initial}.`;
}
