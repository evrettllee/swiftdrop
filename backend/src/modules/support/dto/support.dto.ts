import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { LIST_CURSOR_FIRST_PAGE, NUL_CHARACTER } from '@/common/constants/list.constants';
import {
  SUPPORT_TICKET_STATUS_VALUES,
  TICKET_TOPIC,
  TICKET_TOPIC_VALUES,
} from '@/common/enums/support-ticket.enum';
import {
  listSortParamSchema,
  resolveListQuery,
  unknownParameterError,
} from '@/common/schemas/list-query.schema';
import { listPaginationShape } from '@/common/schemas/pagination.schema';
import {
  SUPPORT_MESSAGES,
  SUPPORT_MESSAGES_PAGE_SIZE_DEFAULT,
  SUPPORT_TEXT_LIMITS,
  SUPPORT_TICKETS_PAGE_SIZE_DEFAULT,
} from '../constants/support.constants';
import { TICKET_MESSAGES_SORT, TICKETS_SORT } from '../utils/support-sort';

function positiveId(message: string) {
  return z
    .number({ error: message })
    .int({ error: message })
    .positive({ error: message })
    .max(DB_INTEGER_MAX, { error: message });
}

export const ticketIdParamSchema = z.object({
  ticketId: z.coerce.number().pipe(positiveId(SUPPORT_MESSAGES.TICKET_ID_INVALID)),
});

export type TicketIdParamDto = z.infer<typeof ticketIdParamSchema>;

export const supportTextSchema = z
  .string({ error: SUPPORT_MESSAGES.TEXT_INVALID })
  .trim()
  .min(SUPPORT_TEXT_LIMITS.MESSAGE_MIN, { error: SUPPORT_MESSAGES.TEXT_INVALID })
  .max(SUPPORT_TEXT_LIMITS.MESSAGE_MAX, { error: SUPPORT_MESSAGES.TEXT_INVALID })
  .refine((text) => !text.includes(NUL_CHARACTER), {
    error: SUPPORT_MESSAGES.TEXT_FORBIDDEN_CHARACTER,
  });

const subjectSchema = z
  .string({ error: SUPPORT_MESSAGES.SUBJECT_INVALID })
  .trim()
  .min(SUPPORT_TEXT_LIMITS.SUBJECT_MIN, { error: SUPPORT_MESSAGES.SUBJECT_INVALID })
  .max(SUPPORT_TEXT_LIMITS.SUBJECT_MAX, { error: SUPPORT_MESSAGES.SUBJECT_INVALID })
  .refine((text) => !text.includes(NUL_CHARACTER), {
    error: SUPPORT_MESSAGES.TEXT_FORBIDDEN_CHARACTER,
  });

export const createTicketSchema = z
  .strictObject(
    {
      topic: z.enum(TICKET_TOPIC_VALUES, { error: SUPPORT_MESSAGES.TOPIC_INVALID }),
      subject: subjectSchema.optional(),
      orderId: positiveId(SUPPORT_MESSAGES.ORDER_ID_INVALID).optional(),
      message: supportTextSchema,
    },
    { error: unknownParameterError },
  )
  .superRefine((body, ctx) => {
    const isOther = body.topic === TICKET_TOPIC.OTHER;

    if (isOther && body.subject === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['subject'],
        message: SUPPORT_MESSAGES.SUBJECT_REQUIRED,
      });
    }

    if (!isOther && body.subject !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['subject'],
        message: SUPPORT_MESSAGES.SUBJECT_NOT_ALLOWED,
      });
    }
  })
  .transform((body) => ({
    topic: body.topic,
    subject: body.subject ?? null,
    orderId: body.orderId ?? null,
    message: body.message,
  }));

export type CreateTicketDto = z.infer<typeof createTicketSchema>;

const ticketsPagination = listPaginationShape(SUPPORT_TICKETS_PAGE_SIZE_DEFAULT);

export const listTicketsSchema = z
  .strictObject(
    {
      limit: ticketsPagination.limit,
      cursor: ticketsPagination.cursor,
      sort: listSortParamSchema,
      status: z
        .enum(SUPPORT_TICKET_STATUS_VALUES, { error: SUPPORT_MESSAGES.STATUS_INVALID })
        .optional(),
    },
    { error: unknownParameterError },
  )
  .transform((query, ctx) => {
    const list = resolveListQuery(
      { ...query, cursor: query.cursor ?? LIST_CURSOR_FIRST_PAGE },
      TICKETS_SORT,
      ctx,
    );

    return list ? { ...list, status: query.status ?? null } : z.NEVER;
  });

export type ListTicketsDto = z.infer<typeof listTicketsSchema>;

const messagesPagination = listPaginationShape(SUPPORT_MESSAGES_PAGE_SIZE_DEFAULT);

export const ticketMessagesSchema = z
  .strictObject(
    { limit: messagesPagination.limit, cursor: messagesPagination.cursor },
    { error: unknownParameterError },
  )
  .transform((query, ctx) => {
    const list = resolveListQuery(
      { ...query, cursor: query.cursor ?? LIST_CURSOR_FIRST_PAGE },
      TICKET_MESSAGES_SORT,
      ctx,
    );

    return list ?? z.NEVER;
  });

export type TicketMessagesDto = z.infer<typeof ticketMessagesSchema>;

export const sendTicketMessageSchema = z.strictObject(
  { text: supportTextSchema },
  { error: unknownParameterError },
);

export type SendTicketMessageDto = z.infer<typeof sendTicketMessageSchema>;
