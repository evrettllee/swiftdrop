import { useState } from 'react';
import { VEHICLE_FILTER_ALL } from '../config/actions';
import { FAILURE_KIND } from '../lib/action-failure';
import { filterCandidates, type VehicleFilter, vehicleChips } from '../lib/candidates';
import { sendAssignRequest, showAssignedToast } from './assign-request';
import type { StaffOrderTarget } from './order-target';
import { useActionSubmit } from './useActionSubmit';
import { useCandidateChoice } from './useCandidateChoice';
import { useCandidates } from './useCandidates';

type AssignOptions = {
  target: StaffOrderTarget;
  isReassign: boolean;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export function useAssignCourier({
  target,
  isReassign,
  isOpen,
  onClose,
  onChanged,
}: AssignOptions) {
  const candidates = useCandidates(target.orderId, isOpen);
  const choice = useCandidateChoice(candidates.answer);
  const action = useActionSubmit();
  const [vehicle, setVehicle] = useState<VehicleFilter>(VEHICLE_FILTER_ALL);
  const [reasonText, setReasonText] = useState('');
  const data = candidates.answer?.data ?? null;
  const shown = data === null ? null : filterCandidates(data, vehicle);
  const selected = shown?.suitable.find(
    ({ courierId }) => courierId === choice.selectedId && courierId !== target.courier?.id,
  );

  async function submit(): Promise<void> {
    if (selected === undefined) {
      return;
    }

    const request = { target, isReassign, courier: selected, reasonText };
    const result = await action.submit(() => sendAssignRequest(request));

    if (result.ok) {
      showAssignedToast(request);
      onClose();
      onChanged();
    } else if (result.failure?.kind === FAILURE_KIND.CONFLICT) {
      onChanged();
      candidates.reload();
    }
  }

  return {
    candidates,
    choice,
    action,
    vehicle,
    setVehicle,
    reasonText,
    setReasonText,
    shown,
    chips: data === null ? [] : vehicleChips(data.suitable),
    canSubmit: selected !== undefined,
    submit,
    refresh: () => {
      onClose();
      onChanged();
    },
  };
}
