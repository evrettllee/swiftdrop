import {
  type ManagerZone,
  ZONE_NAME_MAX_LENGTH,
  ZONE_PRIORITY,
  type ZoneChanges,
} from '@/shared/staff-api';
import { ERROR_TEXTS } from '../config/texts';

const PRIORITY_PATTERN = /^\d{1,3}$/;

export type ZoneDraft = {
  name: string;
  tariffId: number;
  priority: string;
  isActive: boolean;
};

export type DraftErrors = Partial<Record<'name' | 'priority', string>>;

export function draftOf(zone: ManagerZone): ZoneDraft {
  return {
    name: zone.name,
    tariffId: zone.tariff.id,
    priority: String(zone.priority),
    isActive: zone.isActive,
  };
}

function priorityOf(text: string): number | null {
  const trimmed = text.trim();

  if (!PRIORITY_PATTERN.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed);

  return value >= ZONE_PRIORITY.MIN && value <= ZONE_PRIORITY.MAX ? value : null;
}

export function draftErrors(draft: ZoneDraft): DraftErrors {
  const errors: DraftErrors = {};
  const name = draft.name.trim();

  if (name.length === 0 || name.length > ZONE_NAME_MAX_LENGTH) {
    errors.name = ERROR_TEXTS.NAME_INVALID;
  }

  if (priorityOf(draft.priority) === null) {
    errors.priority = ERROR_TEXTS.PRIORITY_INVALID;
  }

  return errors;
}

export function changesOf(zone: ManagerZone, draft: ZoneDraft): ZoneChanges {
  const changes: ZoneChanges = {};
  const name = draft.name.trim();
  const priority = priorityOf(draft.priority);

  if (name !== zone.name) {
    changes.name = name;
  }

  if (draft.tariffId !== zone.tariff.id) {
    changes.tariffId = draft.tariffId;
  }

  if (priority !== null && priority !== zone.priority) {
    changes.priority = priority;
  }

  if (draft.isActive !== zone.isActive) {
    changes.isActive = draft.isActive;
  }

  return changes;
}

export function isDraftChanged(zone: ManagerZone, draft: ZoneDraft): boolean {
  const initial = draftOf(zone);

  return (
    draft.name !== initial.name ||
    draft.tariffId !== initial.tariffId ||
    draft.priority !== initial.priority ||
    draft.isActive !== initial.isActive
  );
}
