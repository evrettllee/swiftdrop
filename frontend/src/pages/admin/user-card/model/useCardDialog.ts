import { useCallback, useState } from 'react';
import type { UserAction } from '../config/actions';

type DialogState = { action: UserAction | null; shown: UserAction | null; opening: number };

const CLOSED: DialogState = { action: null, shown: null, opening: 0 };

export function useCardDialog() {
  const [state, setState] = useState<DialogState>(CLOSED);

  const open = useCallback(
    (action: UserAction) =>
      setState((current) => ({ action, shown: action, opening: current.opening + 1 })),
    [],
  );
  const close = useCallback(() => setState((current) => ({ ...current, action: null })), []);

  return {
    shown: state.shown,
    isOpen: state.action !== null,
    opening: state.opening,
    open,
    close,
  };
}
