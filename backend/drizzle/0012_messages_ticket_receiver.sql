CREATE INDEX "messages_ticket_id_message_id_idx" ON "messages" USING btree ("ticket_id","message_id");--> statement-breakpoint
DROP INDEX "messages_ticket_id_idx";--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "receiver_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_order_receiver_check" CHECK ("messages"."order_id" IS NULL OR "messages"."receiver_id" IS NOT NULL) NOT VALID;--> statement-breakpoint
ALTER TABLE "messages" VALIDATE CONSTRAINT "messages_order_receiver_check";
