import { useEffect, useEffectEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { dropActiveOrder, refreshCourierProfile, useCourierProfile } from '@/entities/courier';
import { formatOrderNumber } from '@/entities/order';
import { armSound, playBeep } from '@/shared/lib/sound';
import { onTypedSocketEvent, SOCKET_EVENTS, useSocketReconnect } from '@/shared/realtime';
import { APP_ROUTES } from '@/shared/routes';
import { hideToast, showToast } from '@/shared/ui/toast';
import { ASSIGNMENT_TEXTS } from '../config/texts';
import {
  ASSIGNMENT_EVENT,
  type AssignmentEvent,
  type AssignmentToast,
  decideAssignment,
  type MissedAssignment,
} from '../lib/assignment';
import { syncMissedAssignment } from './missed-assignment';
import { dismissOffer, useOfferStore, vibrateOffer } from './offer-store';

const ASSIGNMENT_TOAST_KEY = 'assignment';

function showAssignmentToast(orderId: number, toast: AssignmentToast, openWork: () => void): void {
  const orderNumber = formatOrderNumber(orderId);
  const isAssigned = toast.event === ASSIGNMENT_EVENT.ASSIGNED;

  showToast({
    key: ASSIGNMENT_TOAST_KEY,
    variant: isAssigned ? 'info' : 'warning',
    title: isAssigned
      ? ASSIGNMENT_TEXTS.assigned(orderNumber)
      : ASSIGNMENT_TEXTS.unassigned(orderNumber),
    text: '',
    action: toast.hasOpenLink
      ? {
          label: ASSIGNMENT_TEXTS.OPEN,
          onAction: () => {
            hideToast(ASSIGNMENT_TOAST_KEY);
            openWork();
          },
        }
      : undefined,
  });
}

function announceMissed({ event, orderId }: MissedAssignment, openWork: () => void): void {
  const isAssigned = event === ASSIGNMENT_EVENT.ASSIGNED;
  const isOnWorkPage = window.location.pathname === APP_ROUTES.COURIER_WORK;
  showAssignmentToast(orderId, { event, hasOpenLink: isAssigned && !isOnWorkPage }, openWork);

  if (isAssigned) {
    signalAssignment();
  }
}

function signalAssignment(): void {
  vibrateOffer();
  void playBeep();
}

export function useAssignmentSync(): void {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeOrderId = useCourierProfile()?.activeOrderId ?? null;

  const isOnWorkPage = pathname === APP_ROUTES.COURIER_WORK;
  const openWork = () => void navigate(APP_ROUTES.COURIER_WORK);

  const handle = useEffectEvent((event: AssignmentEvent, orderId: number) => {
    const decision = decideAssignment(event, orderId, {
      activeOrderId,
      isOnWorkPage,
      hasOpenOffer: useOfferStore.getState().offer !== null,
    });

    if (decision.dropActiveOrder) {
      dropActiveOrder(orderId);
    }

    if (decision.closeOffer) {
      dismissOffer();
    }

    if (decision.toast !== null) {
      showAssignmentToast(orderId, decision.toast, openWork);
    }

    if (decision.signal) {
      signalAssignment();
    }

    void refreshCourierProfile();
  });

  useEffect(() => armSound(), []);

  useEffect(() => {
    const unsubscribers = [
      onTypedSocketEvent(SOCKET_EVENTS.ORDER_ASSIGNED, ({ orderId }) =>
        handle(ASSIGNMENT_EVENT.ASSIGNED, orderId),
      ),
      onTypedSocketEvent(SOCKET_EVENTS.ORDER_UNASSIGNED, ({ orderId }) =>
        handle(ASSIGNMENT_EVENT.UNASSIGNED, orderId),
      ),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      hideToast(ASSIGNMENT_TOAST_KEY);
    };
  }, []);

  useSocketReconnect(() => void syncMissedAssignment((missed) => announceMissed(missed, openWork)));
}
