import { useEffect, useState } from 'react';

let loading: Promise<void> | null = null;

export function loadGeoman(): Promise<void> {
  loading ??= Promise.all([
    import('@geoman-io/leaflet-geoman-free'),
    import('@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'),
  ]).then(
    () => undefined,
    (error: unknown) => {
      loading = null;
      throw error;
    },
  );

  return loading;
}

export const GEOMAN_STATUS = { LOADING: 'loading', READY: 'ready', FAILED: 'failed' } as const;

export type GeomanStatus = (typeof GEOMAN_STATUS)[keyof typeof GEOMAN_STATUS];

export function useGeoman(): GeomanStatus {
  const [status, setStatus] = useState<GeomanStatus>(GEOMAN_STATUS.LOADING);

  useEffect(() => {
    let isActive = true;

    loadGeoman().then(
      () => {
        if (isActive) {
          setStatus(GEOMAN_STATUS.READY);
        }
      },
      () => {
        if (isActive) {
          setStatus(GEOMAN_STATUS.FAILED);
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, []);

  return status;
}
