import { useState } from 'react';
import { ZoneEditor } from './ZoneEditor';

type ZoneEditDialogProps = {
  zoneId: number | null;
  onClose: () => void;
  onSaved: () => void;
};

type Session = { id: number; zoneId: number | null; isOpen: boolean };

export function ZoneEditDialog({ zoneId, onClose, onSaved }: ZoneEditDialogProps) {
  const isOpen = zoneId !== null;
  const [session, setSession] = useState<Session>({ id: 0, zoneId, isOpen });

  if (isOpen !== session.isOpen || (isOpen && zoneId !== session.zoneId)) {
    setSession({
      id: isOpen ? session.id + 1 : session.id,
      zoneId: isOpen ? zoneId : session.zoneId,
      isOpen,
    });
  }

  const shownId = isOpen ? zoneId : session.zoneId;

  return shownId === null ? null : (
    <ZoneEditor
      key={session.id}
      zoneId={shownId}
      isOpen={isOpen}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
