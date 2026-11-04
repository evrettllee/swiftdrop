import { OverlapNotes, RadiusField, SaveFailure } from '@/features/zone-draw';
import { Button } from '@/shared/ui/button';
import { MANAGER_ZONE_CONTOUR_TEXTS as TEXTS } from '../config/texts';
import type { useZoneContour } from '../model/useZoneContour';

export function ContourPanel({ page }: { page: ReturnType<typeof useZoneContour> }) {
  const { zone, draw, saving } = page;

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-small font-semibold">{TEXTS.NAME}</span>
        <span className="text-heading-sm font-semibold">{zone?.name}</span>
      </div>
      {draw.radiusKm === null ? null : (
        <RadiusField
          radiusKm={draw.radiusKm}
          onRadius={draw.setRadiusKm}
          onToPoints={draw.toPoints}
        />
      )}
      <OverlapNotes notes={page.notes} />
      <SaveFailure
        failure={saving.failure}
        onRetry={() => void page.save()}
        onRefresh={page.refresh}
      />
      <div className="flex flex-col gap-4 pt-4">
        <Button fullWidth loading={saving.isSaving} onClick={() => void page.save()}>
          {TEXTS.SAVE}
        </Button>
        <Button variant="secondary" fullWidth onClick={page.cancel}>
          {TEXTS.CANCEL}
        </Button>
      </div>
    </>
  );
}
