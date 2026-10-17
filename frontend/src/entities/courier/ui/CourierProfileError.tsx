import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { COURIER_PROFILE_TEXTS } from '../config/texts';
import { loadCourierProfile } from '../model/courier-profile';

// The profile could not be loaded: the pages of the cabinet need it, so the courier can try again.
export function CourierProfileError() {
  return (
    <div className="flex flex-col items-start gap-4">
      <InlineAlert variant="error" title={COURIER_PROFILE_TEXTS.LOAD_ERROR_TITLE}>
        {COURIER_PROFILE_TEXTS.LOAD_ERROR_HINT}
      </InlineAlert>
      <Button variant="secondary" onClick={() => void loadCourierProfile()}>
        {COURIER_PROFILE_TEXTS.RETRY}
      </Button>
    </div>
  );
}
