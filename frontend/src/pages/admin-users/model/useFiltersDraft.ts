import { useEffect, useEffectEvent, useState } from 'react';
import { getAdminUsers } from '../api/admin-users';
import {
  type AdminUserStatus,
  type AdminVehicleFilter,
  DEFAULT_USER_STATUSES,
} from '../config/admin-user';
import { LIST_SEARCH_DEBOUNCE_MS } from '@/shared/lib/list-params';
import { orderStatuses, orderVehicles, type UsersParams } from '../config/list-params';
import { toUsersQuery } from './users-view';

const COUNT_LIMIT = 1;

export type FiltersDraft = {
  status: readonly AdminUserStatus[];
  vehicle: readonly AdminVehicleFilter[];
};

function toggle<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

type CountAnswer = { key: string; total: number };

export function useFiltersDraft(values: UsersParams) {
  const [draft, setDraft] = useState<FiltersDraft>({
    status: values.status,
    vehicle: values.vehicle,
  });
  const [answer, setAnswer] = useState<CountAnswer | null>(null);
  const draftValues: UsersParams = { ...values, ...draft };
  const key = JSON.stringify([values.role, values.q, values.sort, draft]);
  const readQuery = useEffectEvent(() => toUsersQuery(draftValues, 1, null, COUNT_LIMIT));

  useEffect(() => {
    const controller = new AbortController();
    const query = readQuery();
    const timer = window.setTimeout(() => {
      getAdminUsers(query, controller.signal).then(
        (page) => {
          if (!controller.signal.aborted) {
            setAnswer({ key, total: page.total });
          }
        },
        () => undefined,
      );
    }, LIST_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return {
    draft,
    draftValues,
    count: answer?.key === key && draft.status.length > 0 ? answer.total : null,
    canApply: draft.status.length > 0,
    toggleStatus: (status: AdminUserStatus) =>
      setDraft((current) => ({
        ...current,
        status: orderStatuses(toggle(current.status, status)),
      })),
    toggleVehicle: (vehicle: AdminVehicleFilter) =>
      setDraft((current) => ({
        ...current,
        vehicle: orderVehicles(toggle(current.vehicle, vehicle)),
      })),
    reset: () => setDraft({ status: DEFAULT_USER_STATUSES, vehicle: [] }),
  };
}
