import { InlineAlert } from '@/shared/ui/inline-alert';
import type { ActionError } from '../../lib/server-error';

export function ActionAlert({ error }: { error: ActionError | null }) {
  if (error === null) {
    return null;
  }

  return error.text === null ? (
    <InlineAlert variant="error" title={error.title} />
  ) : (
    <InlineAlert variant="error" title={error.title}>
      {error.text}
    </InlineAlert>
  );
}
