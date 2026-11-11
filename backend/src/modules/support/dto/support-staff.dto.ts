import { z } from 'zod';
import { TICKET_TOPIC_VALUES } from '@/common/enums/support-ticket.enum';
import {
  csvEnumSchema,
  listPeriodShape,
  listSortParamSchema,
  resolveListQuery,
  unknownParameterError,
} from '@/common/schemas/list-query.schema';
import { listPaginationShape } from '@/common/schemas/pagination.schema';
import { managerSearchSchema } from '@/modules/manager/dto/manager-orders.dto';
import {
  SUPPORT_AUTHOR_ROLE_VALUES,
  SUPPORT_QUEUE_DEFAULT_DIRECTION,
  SUPPORT_STAFF_MESSAGES,
  SUPPORT_STAFF_PAGE_SIZE_DEFAULT,
  SUPPORT_VIEW,
  SUPPORT_VIEW_VALUES,
} from '../constants/support-staff.constants';
import { TICKETS_SORT } from '../utils/support-sort';

const { page, limit, until } = listPaginationShape(SUPPORT_STAFF_PAGE_SIZE_DEFAULT);

export const staffTicketsSchema = z
  .strictObject(
    {
      page,
      limit,
      until,
      ...listPeriodShape,
      sort: listSortParamSchema,
      view: z
        .enum(SUPPORT_VIEW_VALUES, { error: SUPPORT_STAFF_MESSAGES.VIEW_INVALID })
        .default(SUPPORT_VIEW.AWAITING),
      topic: csvEnumSchema(TICKET_TOPIC_VALUES).optional(),
      authorRole: z
        .enum(SUPPORT_AUTHOR_ROLE_VALUES, { error: SUPPORT_STAFF_MESSAGES.AUTHOR_ROLE_INVALID })
        .optional(),
      q: managerSearchSchema.optional(),
    },
    { error: unknownParameterError },
  )
  .transform((query, ctx) => {
    const spec = {
      ...TICKETS_SORT,
      defaultSort: {
        key: 'lastMessageAt' as const,
        direction: SUPPORT_QUEUE_DEFAULT_DIRECTION[query.view],
      },
    };
    const list = resolveListQuery(query, spec, ctx);

    return list
      ? {
          ...list,
          filters: {
            view: query.view,
            topics: query.topic ?? null,
            authorRole: query.authorRole ?? null,
            search: query.q ?? null,
          },
        }
      : z.NEVER;
  });

export type StaffTicketsDto = z.infer<typeof staffTicketsSchema>;

export type StaffTicketFilters = StaffTicketsDto['filters'];
