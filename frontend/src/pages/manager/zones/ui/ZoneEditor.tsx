import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { getManagerZoneContourPath } from '@/shared/routes';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { EDIT_TEXTS } from '../config/texts';
import { useZoneEditor } from '../model/useZoneEditor';
import { DiscardDialog } from './DiscardDialog';
import { ZoneEditorBody } from './ZoneEditorBody';

type ZoneEditorProps = {
  zoneId: number;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type Leave = (() => void) | null;

export function ZoneEditor({ zoneId, isOpen, onClose, onSaved }: ZoneEditorProps) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const navigate = useNavigate();
  const editor = useZoneEditor(zoneId, onSaved);
  const [leave, setLeave] = useState<Leave>(null);
  const { zone } = editor;

  function requestLeave(action: () => void): void {
    if (!isOpen) {
      return;
    }

    if (editor.isDirty) {
      setLeave(() => action);
    } else {
      action();
    }
  }

  function discard(): void {
    const action = leave;
    setLeave(null);
    action?.();
  }

  return (
    <>
      <Dialog
        width="large"
        hasDividers
        isOpen={isOpen}
        onClose={() => requestLeave(onClose)}
        title={isDesktop && zone !== null ? EDIT_TEXTS.title(zone.name) : EDIT_TEXTS.TITLE_SHORT}
        actions={
          <>
            <Button
              loading={editor.saving.isSaving}
              disabled={editor.draft === null}
              onClick={() => void editor.save()}
            >
              {EDIT_TEXTS.SAVE}
            </Button>
            <Button variant="secondary" onClick={() => requestLeave(onClose)}>
              {EDIT_TEXTS.CANCEL}
            </Button>
          </>
        }
      >
        <ZoneEditorBody
          editor={editor}
          onContour={() => requestLeave(() => void navigate(getManagerZoneContourPath(zoneId)))}
        />
      </Dialog>
      <DiscardDialog isOpen={leave !== null} onDiscard={discard} onKeep={() => setLeave(null)} />
    </>
  );
}
