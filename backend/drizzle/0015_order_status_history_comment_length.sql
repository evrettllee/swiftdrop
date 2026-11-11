ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_comment_length_check" CHECK ("order_status_history"."comment" IS NULL OR char_length("order_status_history"."comment") <= 500) NOT VALID;--> statement-breakpoint
ALTER TABLE "order_status_history" VALIDATE CONSTRAINT "order_status_history_comment_length_check";
