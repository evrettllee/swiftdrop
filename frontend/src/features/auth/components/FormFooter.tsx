import { Button } from '../../../shared/ui/Button';
import { InlineAlert } from '../../../shared/ui/InlineAlert';

type FormFooterProps = {
  formError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
};

// The error of the whole form sits right above the submit button, where the user looks after a click.
export function FormFooter({
  formError,
  isSubmitting,
  submitLabel,
  submittingLabel,
}: FormFooterProps) {
  return (
    <>
      {formError === null ? null : <InlineAlert variant="error">{formError}</InlineAlert>}
      <div className="pt-2">
        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </>
  );
}
