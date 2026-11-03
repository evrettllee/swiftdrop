import { formatOrderNumber } from '@/entities/order';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { ASSIGN_TEXTS, ERROR_TEXTS } from '../config/texts';
import { FAILURE_KIND } from '../lib/action-failure';
import { emptyText, suitableSummary } from '../lib/candidates';
import type { StaffOrderTarget } from '../model/order-target';
import { useAssignCourier } from '../model/useAssignCourier';
import { CandidateLists } from './CandidateLists';
import { CandidatesToolbar } from './CandidatesToolbar';
import { FailureAlert } from './FailureAlert';
import { ReasonField } from './ReasonField';

type AssignCourierDialogProps = {
  target: StaffOrderTarget;
  isReassign: boolean;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
};

function titleOf(target: StaffOrderTarget, isReassign: boolean, isDesktop: boolean): string {
  const orderNumber = formatOrderNumber(target.orderId);

  if (isReassign) {
    return isDesktop ? ASSIGN_TEXTS.reassignTitle(orderNumber) : ASSIGN_TEXTS.REASSIGN_TITLE_SHORT;
  }

  return isDesktop ? ASSIGN_TEXTS.assignTitle(orderNumber) : ASSIGN_TEXTS.ASSIGN_TITLE_SHORT;
}

export function AssignCourierDialog(props: AssignCourierDialogProps) {
  const { target, isReassign, isOpen, onClose } = props;
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const assign = useAssignCourier(props);
  const { candidates, choice, action, shown } = assign;
  const answer = candidates.answer;

  return (
    <Dialog
      width="large"
      hasDividers
      isBodyScrolling
      isOpen={isOpen}
      onClose={onClose}
      title={titleOf(target, isReassign, isDesktop)}
      actions={
        <>
          <Button
            loading={action.isSubmitting}
            disabled={!assign.canSubmit}
            onClick={() => void assign.submit()}
          >
            {isReassign ? ASSIGN_TEXTS.SUBMIT_REASSIGN : ASSIGN_TEXTS.SUBMIT_ASSIGN}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {ASSIGN_TEXTS.CANCEL}
          </Button>
        </>
      }
    >
      <CandidatesToolbar
        searchText={candidates.searchText}
        sort={candidates.sort}
        chips={assign.chips}
        vehicle={assign.vehicle}
        onSearchChange={candidates.setSearchText}
        onSortChange={candidates.setSort}
        onVehicleChange={assign.setVehicle}
      />
      <FailureAlert
        failure={action.failure}
        isFieldShown={isReassign}
        onRetry={() => void assign.submit()}
        onRefresh={assign.refresh}
      />
      {choice.isLost ? <InlineAlert variant="warning" title={ASSIGN_TEXTS.COURIER_GONE} /> : null}
      {answer?.isFailed === true ? (
        <div className="flex flex-col items-start gap-2">
          <InlineAlert variant="error" title={ASSIGN_TEXTS.LOAD_FAILED} />
          <Button variant="secondary" onClick={candidates.reload}>
            {ERROR_TEXTS.RETRY}
          </Button>
        </div>
      ) : null}
      {shown === null ? null : (
        <div aria-busy={candidates.isLoading} className="flex flex-col gap-4">
          <p className="text-small text-fg-secondary tabular-nums">
            {shown.suitable.length === 0
              ? emptyText(candidates.searchText, assign.vehicle)
              : suitableSummary(shown.suitable.length, target.parcelWeightKg)}
          </p>
          <CandidateLists
            candidates={shown}
            selectedId={choice.selectedId}
            currentCourierId={isReassign ? (target.courier?.id ?? null) : null}
            isDesktop={isDesktop}
            onSelect={choice.select}
          />
        </div>
      )}
      {isReassign ? (
        <ReasonField
          value={assign.reasonText}
          hint={ASSIGN_TEXTS.REASON_OPTIONAL_HINT}
          error={action.failure?.kind === FAILURE_KIND.FIELD ? action.failure.title : undefined}
          onChange={assign.setReasonText}
        />
      ) : null}
    </Dialog>
  );
}
