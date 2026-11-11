import type { OverlapNote } from '@/entities/zone';
import { InlineAlert } from '@/shared/ui/inline-alert';

export function OverlapNotes({ notes }: { notes: readonly OverlapNote[] }) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {notes.map((note) => (
        <InlineAlert key={note.zoneId} variant="warning" title={note.title}>
          {note.text}
        </InlineAlert>
      ))}
    </div>
  );
}
