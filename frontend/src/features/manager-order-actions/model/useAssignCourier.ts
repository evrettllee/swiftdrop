import { useState } from 'react';
import { VEHICLE_FILTER_ALL } from '../config/actions';
import { candidatesView, type VehicleFilter } from '../lib/candidates';
import { runAssign } from './assign-request';
import type { StaffOrderTarget } from './order-target';
import { useActionSubmit } from './useActionSubmit';
import { useCandidateChoice } from './useCandidateChoice';
import { useCandidates } from './useCandidates';
import { useParcelWeight } from './useParcelWeight';

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
  const weight = useParcelWeight(target, isOpen);
  const [vehicle, setVehicle] = useState<VehicleFilter>(VEHICLE_FILTER_ALL);
  const [reasonText, setReasonText] = useState('');
  const currentId = isReassign ? (target.courier?.id ?? null) : null;
  const { shown, choosable, chips } = candidatesView(
    candidates.answer?.data ?? null,
    vehicle,
    currentId,
  );
  const selected = choosable.find(({ courierId }) => courierId === choice.selectedId);

  const effects = { onClose, onChanged, onConflict: candidates.reload };
  const submit = () =>
    selected === undefined
      ? Promise.resolve()
      : runAssign(action.submit, { target, isReassign, courier: selected, reasonText }, effects);

  return {
    candidates,
    choice,
    action,
    vehicle,
    setVehicle,
    reasonText,
    setReasonText,
    shown,
    currentId,
    suitableCount: choosable.length,
    weight,
    chips,
    canSubmit: selected !== undefined,
    submit,
    refresh: () => {
      onClose();
      onChanged();
    },
  };
}
