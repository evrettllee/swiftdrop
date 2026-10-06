// Empty parts stand for switched-off conditional classes and are dropped.
export function joinClassNames(...classNames: string[]): string {
  return classNames.filter(Boolean).join(' ');
}
