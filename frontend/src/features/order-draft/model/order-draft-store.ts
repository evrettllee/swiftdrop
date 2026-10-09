import { create } from 'zustand';
import { type PersistStorage, persist, type StorageValue } from 'zustand/middleware';
import { AUTH_STATUS, useAuthStore } from '@/shared/session';
import { ORDER_DRAFT_STORAGE_KEY } from '../config/order-draft';
import { type OrderDraft, type OrderDraftData, storedOrderDraftSchema } from './order-draft';

const EMPTY_DRAFT: OrderDraft = {
  route: null,
  package: null,
  apartments: null,
  recipient: null,
  pendingCheckout: false,
  ownerId: null,
};

function removeStoredDraft(name: string): void {
  try {
    sessionStorage.removeItem(name);
  } catch {
    // Storage can be blocked (private mode), then there is nothing to remove.
  }
}

// The stored draft is untrusted: anything that does not pass the schema is removed silently,
// and the draft starts empty.
function readStoredDraft(name: string): StorageValue<OrderDraft> | null {
  let draft: StorageValue<OrderDraft> | null = null;
  let isInvalid = false;

  try {
    const raw = sessionStorage.getItem(name);

    if (raw !== null) {
      const value: unknown = JSON.parse(raw);
      const parsed = storedOrderDraftSchema.safeParse(value);

      draft = parsed.success ? parsed.data : null;
      isInvalid = !parsed.success;
    }
  } catch {
    // Broken JSON, or the storage is blocked.
    isInvalid = true;
  }

  if (isInvalid) {
    removeStoredDraft(name);
  }

  return draft;
}

function writeStoredDraft(name: string, value: StorageValue<OrderDraft>): void {
  try {
    sessionStorage.setItem(name, JSON.stringify(value));
  } catch {
    // The draft just will not survive the sign-in.
  }
}

// A synchronous storage: the draft is read while the store is created, so the order form gets it
// on its first render.
const draftStorage: PersistStorage<OrderDraft> = {
  getItem: readStoredDraft,
  setItem: writeStoredDraft,
  removeItem: removeStoredDraft,
};

const useOrderDraftStore = create<OrderDraft>()(
  persist(() => EMPTY_DRAFT, { name: ORDER_DRAFT_STORAGE_KEY, storage: draftStorage }),
);

type SaveOptions = {
  // The order form is awaited after the sign-in; false for a user who is signed in already.
  // Left out (the autosave of the order form), the flag stays as it is.
  pendingCheckout?: boolean;
};

function isSessionRestored(): boolean {
  return useAuthStore.getState().status !== AUTH_STATUS.LOADING;
}

function readSessionUserId(): number | null {
  return useAuthStore.getState().user?.userId ?? null;
}

// An "order" button of the landing, "repeat the order" or the autosave of the order form: with the
// data the draft is replaced by them and belongs to the current user (null for a guest), without
// them the draft keeps what it has, its owner included.
export function saveOrderDraft(data: OrderDraftData | undefined, options: SaveOptions = {}): void {
  const flag =
    options.pendingCheckout === undefined ? {} : { pendingCheckout: options.pendingCheckout };

  useOrderDraftStore.setState(
    data === undefined
      ? flag
      : {
          route: data.route,
          package: data.package,
          apartments: data.apartments ?? null,
          recipient: data.recipient ?? null,
          ownerId: readSessionUserId(),
          ...flag,
        },
  );
}

// Who may see the draft, checked once the session is known: a guest's draft passes to the user who
// signs in (the pending checkout stays), and a draft of another user, or of a user while nobody is
// signed in, is removed. The tab may have been reloaded after another account signed in elsewhere.
export function applyOrderDraftAccess(): void {
  if (!isSessionRestored()) {
    return;
  }

  const userId = readSessionUserId();
  const { ownerId } = useOrderDraftStore.getState();

  if (ownerId === null) {
    if (userId !== null) {
      useOrderDraftStore.setState({ ownerId: userId });
    }
  } else if (ownerId !== userId) {
    clearOrderDraft();
  }
}

export function readOrderDraft(): OrderDraft {
  applyOrderDraftAccess();

  const draft = useOrderDraftStore.getState();

  // While the session is restored, a draft of a signed-in user is not shown: its owner is not
  // known to be the one in the tab yet.
  return draft.ownerId === null || isSessionRestored() ? draft : EMPTY_DRAFT;
}

export function usePendingCheckout(): boolean {
  return useOrderDraftStore((state) => state.pendingCheckout);
}

export function clearPendingCheckout(): void {
  useOrderDraftStore.setState({ pendingCheckout: false });
}

export function clearOrderDraft(): void {
  useOrderDraftStore.setState(EMPTY_DRAFT);
  useOrderDraftStore.persist.clearStorage();
}
