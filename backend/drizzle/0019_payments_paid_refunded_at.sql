ALTER TABLE "payments" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refunded_at" timestamp with time zone;--> statement-breakpoint
UPDATE "payments" AS p SET "paid_at" = coalesce((SELECT min(h."changed_at") FROM "order_status_history" AS h WHERE h."order_id" = p."order_id" AND h."status" = 'confirmed'), p."created_at") WHERE p."status" IN ('paid', 'refunded') AND p."paid_at" IS NULL;--> statement-breakpoint
UPDATE "payments" AS p SET "refunded_at" = coalesce((SELECT max(h."changed_at") FROM "order_status_history" AS h WHERE h."order_id" = p."order_id" AND h."status" = 'cancelled'), p."paid_at", p."created_at") WHERE p."status" = 'refunded' AND p."refunded_at" IS NULL;--> statement-breakpoint
CREATE INDEX "support_tickets_order_id_idx" ON "support_tickets" USING btree ("order_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_paid_at_check" CHECK ("payments"."status" <> 'paid' OR "payments"."paid_at" IS NOT NULL) NOT VALID;--> statement-breakpoint
ALTER TABLE "payments" VALIDATE CONSTRAINT "payments_paid_at_check";--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_refunded_at_check" CHECK ("payments"."status" <> 'refunded' OR "payments"."refunded_at" IS NOT NULL) NOT VALID;--> statement-breakpoint
ALTER TABLE "payments" VALIDATE CONSTRAINT "payments_refunded_at_check";
