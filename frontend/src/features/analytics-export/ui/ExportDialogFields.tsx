import { useId } from 'react';
import type { AnalyticsExportRole, AnalyticsExportSection } from '@/shared/analytics-api';
import { EXPORT_FORMAT, type ExportFormat } from '@/shared/staff-api';
import { Checkbox } from '@/shared/ui/checkbox';
import { RadioCard } from '@/shared/ui/radio-card';
import {
  ANALYTICS_EXPORT_TEXTS as TEXTS,
  EXPORT_SECTION_LABELS,
  ROLE_EXPORT_SECTIONS,
} from '../config/export-config';
import { csvSectionsFor } from '../model/export-state';

export function FormatFieldset({
  format,
  onChange,
}: {
  format: ExportFormat;
  onChange: (next: ExportFormat) => void;
}) {
  const name = useId();
  const isXlsx = format === EXPORT_FORMAT.XLSX;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-caption font-semibold tracking-caps text-fg-secondary uppercase">
        {TEXTS.FORMAT_LEGEND}
      </legend>
      <RadioCard
        name={name}
        value={EXPORT_FORMAT.XLSX}
        title={TEXTS.FORMAT_XLSX}
        description={TEXTS.FORMAT_XLSX_DESCRIPTION}
        checked={isXlsx}
        onChange={() => onChange(EXPORT_FORMAT.XLSX)}
      />
      <RadioCard
        name={name}
        value={EXPORT_FORMAT.CSV}
        title={TEXTS.FORMAT_CSV}
        description={TEXTS.FORMAT_CSV_DESCRIPTION}
        checked={!isXlsx}
        onChange={() => onChange(EXPORT_FORMAT.CSV)}
      />
    </fieldset>
  );
}

export function SectionsFieldset({
  role,
  format,
  xlsxSections,
  csvSection,
  onToggleXlsx,
  onSelectCsv,
}: {
  role: AnalyticsExportRole;
  format: ExportFormat;
  xlsxSections: readonly AnalyticsExportSection[];
  csvSection: AnalyticsExportSection;
  onToggleXlsx: (section: AnalyticsExportSection) => void;
  onSelectCsv: (section: AnalyticsExportSection) => void;
}) {
  const csvName = useId();
  const isXlsx = format === EXPORT_FORMAT.XLSX;
  const hasSections = xlsxSections.length > 0;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-caption font-semibold tracking-caps text-fg-secondary uppercase">
        {TEXTS.SECTIONS_LEGEND}
      </legend>
      {isXlsx ? (
        <>
          <div className="flex flex-col gap-3 text-fg">
            {ROLE_EXPORT_SECTIONS[role].map((section) => (
              <Checkbox
                key={section}
                label={EXPORT_SECTION_LABELS[section]}
                checked={xlsxSections.includes(section)}
                onChange={() => onToggleXlsx(section)}
              />
            ))}
          </div>
          <p
            role={hasSections ? undefined : 'alert'}
            className={`text-caption ${hasSections ? 'text-fg-secondary' : 'text-danger'}`}
          >
            {hasSections ? TEXTS.DEFAULT_ALL_HINT : TEXTS.NO_SECTION_HINT}
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {csvSectionsFor(role).map((section) => (
            <RadioCard
              key={section}
              name={csvName}
              value={section}
              density="compact"
              title={EXPORT_SECTION_LABELS[section]}
              checked={csvSection === section}
              onChange={() => onSelectCsv(section)}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}
