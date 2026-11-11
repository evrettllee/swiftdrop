import type { GeoPoint } from '@/shared/lib/geo';
import type { ManagerZone } from '@/shared/staff-api';
import { OVERLAP_TEXTS } from '../config/texts';
import { OVERLAP_WINNER, overlapWinner, ringsOverlap, type ZoneRank } from './overlap';

export type Neighbor = { zone: ManagerZone; ring: readonly GeoPoint[] };

export type OverlapNote = { zoneId: number; title: string; text: string };

function noteText(subject: ZoneRank, zone: ManagerZone): string {
  const isSubjectWinner = overlapWinner(subject, zone) === OVERLAP_WINNER.SUBJECT;
  const subjectWins = subject.id === null ? OVERLAP_TEXTS.NEW_WINS : OVERLAP_TEXTS.SELF_WINS;
  const outcome = isSubjectWinner ? subjectWins : OVERLAP_TEXTS.otherWins(zone.name);
  const tie = subject.priority === zone.priority ? OVERLAP_TEXTS.EQUAL : '';

  return `${OVERLAP_TEXTS.priority(zone.name, zone.priority)}${outcome}${tie}`;
}

export function overlapNotes(
  ring: readonly GeoPoint[],
  subject: ZoneRank,
  neighbors: readonly Neighbor[],
): OverlapNote[] {
  return neighbors
    .filter(({ zone }) => zone.isActive && zone.id !== subject.id)
    .filter((neighbor) => ringsOverlap(ring, neighbor.ring))
    .map(({ zone }) => ({
      zoneId: zone.id,
      title: OVERLAP_TEXTS.title(zone.name),
      text: noteText(subject, zone),
    }));
}
