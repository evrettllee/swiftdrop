import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { SERVICE_ZONE_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { unknownParameterError } from '@/common/schemas/list-query.schema';
import {
  MANAGER_ZONES_MESSAGES as MESSAGES,
  ZONE_PRIORITY,
  ZONE_RING_MAX_RAW_POINTS,
} from '../constants/manager-zones.constants';

const idSchema = (error: string) =>
  z.coerce.number({ error }).int({ error }).positive({ error }).max(DB_INTEGER_MAX, { error });

export const zoneIdParamSchema = z.strictObject({ zoneId: idSchema(MESSAGES.ZONE_ID_INVALID) });

export type ZoneIdParamDto = z.infer<typeof zoneIdParamSchema>;

const pointSchema = z.tuple([z.number().finite(), z.number().finite()], {
  error: MESSAGES.POLYGON_SHAPE_INVALID,
});

const zoneFields = {
  name: z
    .string({ error: MESSAGES.NAME_INVALID })
    .trim()
    .min(SERVICE_ZONE_FIELD_LENGTH.NAME_MIN, { error: MESSAGES.NAME_INVALID })
    .max(SERVICE_ZONE_FIELD_LENGTH.NAME, { error: MESSAGES.NAME_INVALID }),
  polygon: z
    .array(
      z
        .array(pointSchema, { error: MESSAGES.POLYGON_SHAPE_INVALID })
        .min(1, { error: MESSAGES.POLYGON_SHAPE_INVALID })
        .max(ZONE_RING_MAX_RAW_POINTS, { error: MESSAGES.POLYGON_SHAPE_INVALID }),
      { error: MESSAGES.POLYGON_SHAPE_INVALID },
    )
    .length(1, { error: MESSAGES.POLYGON_SHAPE_INVALID }),
  tariffId: z
    .number({ error: MESSAGES.TARIFF_ID_INVALID })
    .int({ error: MESSAGES.TARIFF_ID_INVALID })
    .positive({ error: MESSAGES.TARIFF_ID_INVALID })
    .max(DB_INTEGER_MAX, { error: MESSAGES.TARIFF_ID_INVALID }),
  priority: z
    .number({ error: MESSAGES.PRIORITY_INVALID })
    .int({ error: MESSAGES.PRIORITY_INVALID })
    .min(ZONE_PRIORITY.MIN, { error: MESSAGES.PRIORITY_INVALID })
    .max(ZONE_PRIORITY.MAX, { error: MESSAGES.PRIORITY_INVALID }),
  isActive: z.boolean({ error: MESSAGES.ACTIVE_INVALID }),
};

export const createZoneSchema = z.strictObject(
  {
    ...zoneFields,
    priority: zoneFields.priority.default(ZONE_PRIORITY.MIN),
    isActive: zoneFields.isActive.default(true),
  },
  { error: unknownParameterError },
);

export type CreateZoneDto = z.infer<typeof createZoneSchema>;

const EXPECTED_UPDATED_AT_KEY = 'expectedUpdatedAt';

export const updateZoneSchema = z
  .strictObject(
    {
      name: zoneFields.name.optional(),
      polygon: zoneFields.polygon.optional(),
      tariffId: zoneFields.tariffId.optional(),
      priority: zoneFields.priority.optional(),
      isActive: zoneFields.isActive.optional(),
      expectedUpdatedAt: z.iso.datetime({ error: MESSAGES.EXPECTED_UPDATED_AT_INVALID }),
    },
    { error: unknownParameterError },
  )
  .refine((body) => Object.keys(body).some((key) => key !== EXPECTED_UPDATED_AT_KEY), {
    error: MESSAGES.NOTHING_TO_CHANGE,
  });

export type UpdateZoneDto = z.infer<typeof updateZoneSchema>;
