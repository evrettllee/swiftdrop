import type { ManagerZone } from '@/shared/staff-api';
import {
  Table,
  TABLE_ALIGN,
  TABLE_SORT,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@/shared/ui/table';
import { COLUMN_TEXTS, MANAGER_ZONES_TEXTS as TEXTS } from '../config/texts';
import { zoneArea, zoneUpdated } from '../lib/zone-format';
import { ZoneEditLink } from './ZoneEditLink';
import { ZoneName } from './ZoneName';
import { ZoneStatusSwitch } from './ZoneStatusSwitch';

export type ZoneListProps = {
  zones: readonly ManagerZone[];
  selectedId: number | null;
  isPending: (zoneId: number) => boolean;
  onSelect: (zoneId: number) => void;
  onToggle: (zone: ManagerZone, isActive: boolean) => void;
};

export function ZonesTable({ zones, selectedId, isPending, onSelect, onToggle }: ZoneListProps) {
  return (
    <Table
      label={TEXTS.TABLE_LABEL}
      footer={<span className="tabular-nums">{TEXTS.shown(1, zones.length, zones.length)}</span>}
    >
      <thead>
        <tr>
          <TableHeaderCell sort={TABLE_SORT.ASCENDING}>{COLUMN_TEXTS.ZONE}</TableHeaderCell>
          <TableHeaderCell>{COLUMN_TEXTS.TARIFF}</TableHeaderCell>
          <TableHeaderCell align={TABLE_ALIGN.END}>{COLUMN_TEXTS.PRIORITY}</TableHeaderCell>
          <TableHeaderCell align={TABLE_ALIGN.END}>{COLUMN_TEXTS.AREA}</TableHeaderCell>
          <TableHeaderCell>{COLUMN_TEXTS.UPDATED}</TableHeaderCell>
          <TableHeaderCell className="min-w-38">{COLUMN_TEXTS.STATUS}</TableHeaderCell>
          <TableHeaderCell align={TABLE_ALIGN.END}>
            <span className="sr-only">{COLUMN_TEXTS.ACTIONS}</span>
          </TableHeaderCell>
        </tr>
      </thead>
      <tbody>
        {zones.map((zone) => (
          <TableRow key={zone.id} isSelected={zone.id === selectedId}>
            <TableCell>
              <ZoneName zone={zone} isSelected={zone.id === selectedId} onSelect={onSelect} />
            </TableCell>
            <TableCell>{zone.tariff.name}</TableCell>
            <TableCell align={TABLE_ALIGN.END} className="tabular-nums">
              {zone.priority}
            </TableCell>
            <TableCell align={TABLE_ALIGN.END} className="whitespace-nowrap tabular-nums">
              {zoneArea(zone)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-fg-secondary tabular-nums">
              {zoneUpdated(zone)}
            </TableCell>
            <TableCell>
              <ZoneStatusSwitch zone={zone} isPending={isPending(zone.id)} onToggle={onToggle} />
            </TableCell>
            <TableCell align={TABLE_ALIGN.END}>
              <ZoneEditLink zone={zone} />
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}
