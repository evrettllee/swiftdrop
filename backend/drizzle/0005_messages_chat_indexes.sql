DROP INDEX "messages_order_id_sent_at_idx";--> statement-breakpoint
CREATE INDEX "messages_order_id_message_id_idx" ON "messages" USING btree ("order_id","message_id");--> statement-breakpoint
CREATE INDEX "messages_unread_idx" ON "messages" USING btree ("receiver_id","order_id") WHERE "messages"."is_read" = false AND "messages"."order_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_single_context_chk" CHECK (NOT ("messages"."order_id" IS NOT NULL AND "messages"."ticket_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_content_length_chk" CHECK ("messages"."content" IS NULL OR char_length("messages"."content") <= 1000);