import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { BlockLoader } from '@/shared/ui/page-loader';
import { EDIT_TEXTS } from '../config/texts';
import { DETAILS_STATUS } from '@/entities/zone';
import type { useZoneEditor } from '../model/useZoneEditor';
import { ZoneForm } from './ZoneForm';
import { ZoneNotices } from './ZoneNotices';

type ZoneEditorBodyProps = {
  editor: ReturnType<typeof useZoneEditor>;
  onContour: () => void;
};

export function ZoneEditorBody({ editor, onContour }: ZoneEditorBodyProps) {
  const { zone, draft, status, saving } = editor;

  if (status === DETAILS_STATUS.NOT_FOUND) {
    return (
      <InlineAlert variant="warning" title={EDIT_TEXTS.NOT_FOUND}>
        {EDIT_TEXTS.NOT_FOUND_TEXT}
      </InlineAlert>
    );
  }

  if (status === DETAILS_STATUS.FAILED && zone === null) {
    return (
      <div className="flex flex-col items-start gap-2">
        <InlineAlert variant="error" title={EDIT_TEXTS.LOAD_FAILED} />
        <Button variant="secondary" onClick={editor.reload}>
          {EDIT_TEXTS.RETRY}
        </Button>
      </div>
    );
  }

  if (zone === null || draft === null) {
    return <BlockLoader text={EDIT_TEXTS.LOADING} className="py-12" />;
  }

  return (
    <>
      <ZoneNotices
        failure={saving.failure}
        isChangedElsewhere={editor.isChangedElsewhere}
        onRefresh={editor.refresh}
        onRetry={() => void editor.save()}
      />
      <ZoneForm
        zone={zone}
        draft={draft}
        tariffs={editor.tariffs}
        errors={saving.errors}
        failure={saving.failure}
        onChange={editor.change}
        onContour={onContour}
      />
    </>
  );
}
