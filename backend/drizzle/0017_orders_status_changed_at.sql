ALTER TABLE "orders" ADD COLUMN "status_changed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "orders" AS o
SET "status_changed_at" = coalesce(
  (
    SELECT max(h."changed_at")
    FROM "order_status_history" AS h
    WHERE h."order_id" = o."order_id"
  ),
  o."created_at"
)
WHERE o."status_changed_at" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status_changed_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_changed_at_not_null" CHECK ("status_changed_at" IS NOT NULL) NOT VALID;--> statement-breakpoint
ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_status_changed_at_not_null";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status_changed_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_status_changed_at_not_null";--> statement-breakpoint
CREATE INDEX "orders_status_changed_at_idx" ON "orders" USING btree ("status","status_changed_at","order_id");--> statement-breakpoint
DROP INDEX "orders_client_id_idx";
