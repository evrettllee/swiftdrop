CREATE TYPE "public"."ticket_topic" AS ENUM('order_problem', 'payment', 'account', 'client_unreachable', 'app', 'other');--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DEFAULT 'open'::text;--> statement-breakpoint
DROP TYPE "public"."support_ticket_status";--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'closed');--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."support_ticket_status";--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DATA TYPE "public"."support_ticket_status" USING "status"::"public"."support_ticket_status";--> statement-breakpoint
DROP INDEX "support_tickets_user_id_idx";--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "subject" SET DATA TYPE varchar(80);--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "subject" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "topic" "ticket_topic" NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "last_message_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "awaiting_staff" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "closed_by" integer;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_closed_by_users_user_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_tickets_user_id_ticket_id_idx" ON "support_tickets" USING btree ("user_id","ticket_id" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "support_tickets_queue_idx" ON "support_tickets" USING btree ("awaiting_staff","last_message_at") WHERE "support_tickets"."status" <> 'closed';--> statement-breakpoint
CREATE UNIQUE INDEX "support_tickets_one_open_per_order_uidx" ON "support_tickets" USING btree ("order_id","user_id") WHERE "support_tickets"."status" <> 'closed' AND "support_tickets"."order_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_subject_required_check" CHECK ("support_tickets"."topic" <> 'other' OR "support_tickets"."subject" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_subject_length_check" CHECK ("support_tickets"."subject" IS NULL OR char_length("support_tickets"."subject") BETWEEN 1 AND 80);--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_closed_check" CHECK (("support_tickets"."status" = 'closed') = ("support_tickets"."closed_at" IS NOT NULL));