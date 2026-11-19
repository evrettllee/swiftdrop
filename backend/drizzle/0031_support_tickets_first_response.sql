ALTER TABLE "support_tickets" ADD COLUMN "first_response_at" timestamp with time zone;--> statement-breakpoint
UPDATE "support_tickets" SET "first_response_at" = "replies"."first_response_at"
FROM (
  SELECT "messages"."ticket_id", min("messages"."sent_at") AS "first_response_at"
  FROM "messages"
  INNER JOIN "support_tickets" AS "ticket" ON "ticket"."ticket_id" = "messages"."ticket_id"
  WHERE "messages"."sender_id" <> "ticket"."user_id"
  GROUP BY "messages"."ticket_id"
) AS "replies"
WHERE "replies"."ticket_id" = "support_tickets"."ticket_id";
