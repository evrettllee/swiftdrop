// The text of a caught value for a log line: anything can be thrown, not only an Error.
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
