import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { APP_ROUTES, ZONE_ID_PARAM } from '@/shared/routes';
import { visibleZones } from '../lib/zone-list';
import { useZonePolygons } from './useZonePolygons';
import { useZones } from './useZones';
import { useZoneToggle } from './useZoneToggle';

const ZONE_ID_PATTERN = /^[1-9]\d{0,9}$/;

function parseZoneId(raw: string | undefined): number | null {
  return raw !== undefined && ZONE_ID_PATTERN.test(raw) ? Number(raw) : null;
}

export function useZonesPage() {
  const navigate = useNavigate();
  const editedId = parseZoneId(useParams()[ZONE_ID_PARAM]);
  const list = useZones();
  const polygons = useZonePolygons(list.zones);
  const toggle = useZoneToggle(list.reload);
  const [search, setSearch] = useState('');
  const [isDisabledShown, setIsDisabledShown] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const shown = useMemo(
    () => visibleZones(list.zones ?? [], search, isDisabledShown),
    [list.zones, search, isDisabledShown],
  );
  const closeEditor = useCallback(() => void navigate(APP_ROUTES.MANAGER_ZONES), [navigate]);
  const { reload } = list;
  const onSaved = useCallback(() => {
    closeEditor();
    reload();
  }, [closeEditor, reload]);

  return {
    list,
    polygons,
    toggle,
    search,
    setSearch,
    isDisabledShown,
    setIsDisabledShown,
    shown,
    selectedId: selectedId ?? editedId,
    select: setSelectedId,
    editedId,
    closeEditor,
    onSaved,
  };
}
