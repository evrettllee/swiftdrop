import { DrizzleQueryError } from 'drizzle-orm';

// The reason a query failed: the Postgres error code when there is one (some Postgres messages
// quote the values of the query), otherwise the message, for example of a lost connection.
function describeQueryCause(cause: unknown): string {
  const code =
    typeof cause === 'object' && cause !== null && 'code' in cause && typeof cause.code === 'string'
      ? cause.code
      : null;

  return code ?? (cause instanceof Error ? cause.message : 'unknown cause');
}

// The text of a caught value for a log line: anything can be thrown, not only an Error. A failed
// query keeps its SQL but never its parameters: they hold what users sent (a chat message, a
// position), which must not reach the logs.
export function describeError(error: unknown): string {
  if (error instanceof DrizzleQueryError) {
    return `Failed query: ${error.query} (${describeQueryCause(error.cause)})`;
  }

  return error instanceof Error ? error.message : String(error);
}

// The stack for a log line. The stack of a failed query starts with its message, parameters
// included, so the stack of its cause is given instead.
export function describeErrorStack(error: unknown): string | undefined {
  const source = error instanceof DrizzleQueryError ? error.cause : error;

  return source instanceof Error ? source.stack : undefined;
}
