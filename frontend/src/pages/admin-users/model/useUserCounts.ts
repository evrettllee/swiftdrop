import { useCallback, useEffect, useState } from 'react';
import { type AdminUserCounts, getAdminUserCounts } from '../api/admin-users';
import { type AdminUserStatus } from '../config/admin-user';

type CountsAnswer = { key: string; counts: AdminUserCounts };

export function useUserCounts(status: readonly AdminUserStatus[], q: string | null) {
  const [reloads, setReloads] = useState(0);
  const [answer, setAnswer] = useState<CountsAnswer | null>(null);
  const key = JSON.stringify([status, q, reloads]);

  useEffect(() => {
    const controller = new AbortController();

    getAdminUserCounts({ status, q }, controller.signal).then(
      (counts) => {
        if (!controller.signal.aborted) {
          setAnswer({ key, counts });
        }
      },
      () => undefined,
    );

    return () => controller.abort();
  }, [key, status, q]);

  const reload = useCallback(() => setReloads((count) => count + 1), []);

  return { counts: answer?.counts ?? null, reload };
}
