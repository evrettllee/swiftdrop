import { z } from 'zod';
import { listPeriodShape, unknownParameterError } from '@/common/schemas/list-query.schema';
import {
  ANALYTICS_EXPORT_MESSAGES as MESSAGES,
  EXPORT_SECTION,
  type ExportSection,
  SECTIONS_SEPARATOR,
} from '../constants/analytics-export.constants';
import {
  EXPORT_FORMAT,
  EXPORT_FORMAT_VALUES,
  MANAGER_EXPORT_MESSAGES,
} from '../constants/manager-export.constants';
import { checkPeriod } from './manager-analytics.dto';

const SECTIONS_PATH = ['sections'];

function sectionsError(sections: readonly string[], format: string, allowed: readonly string[]) {
  if (sections.length === 0) {
    return MESSAGES.NO_SECTION;
  }

  if (sections.some((section) => !allowed.includes(section))) {
    return MESSAGES.UNKNOWN_SECTION;
  }

  if (format === EXPORT_FORMAT.CSV && sections.length > 1) {
    return MESSAGES.CSV_ONE_TABLE;
  }

  return format === EXPORT_FORMAT.CSV && sections.includes(EXPORT_SECTION.SUMMARY)
    ? MESSAGES.CSV_NO_SUMMARY
    : null;
}

export function analyticsExportSchema<S extends ExportSection>(allowed: readonly S[]) {
  return z
    .strictObject(
      {
        ...listPeriodShape,
        format: z.enum(EXPORT_FORMAT_VALUES, { error: MANAGER_EXPORT_MESSAGES.FORMAT_INVALID }),
        sections: z.string().optional(),
      },
      { error: unknownParameterError },
    )
    .superRefine(checkPeriod)
    .transform((query, ctx) => {
      const asked = new Set(
        (query.sections ?? '')
          .split(SECTIONS_SEPARATOR)
          .map((section) => section.trim())
          .filter((section) => section !== ''),
      );
      const message = sectionsError([...asked], query.format, allowed);

      if (message !== null) {
        ctx.addIssue({ code: 'custom', path: SECTIONS_PATH, message });

        return z.NEVER;
      }

      return {
        from: query.from,
        to: query.to,
        format: query.format,
        sections: allowed.filter((section) => asked.has(section)),
      };
    });
}

export type AnalyticsExportDto<S extends ExportSection> = z.infer<
  ReturnType<typeof analyticsExportSchema<S>>
>;
