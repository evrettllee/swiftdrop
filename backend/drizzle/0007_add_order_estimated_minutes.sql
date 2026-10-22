ALTER TABLE "orders" ADD COLUMN "estimated_minutes" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_estimated_minutes_check" CHECK ("orders"."estimated_minutes" >= 0);--> statement-breakpoint
-- The orders placed before the column: an order that never had a courier still keeps the delivery
-- time it was placed with (created_at plus the time of the trip), so the time of the trip is read
-- back from it. An order that had a courier may have a moved estimate and stays null: its time of
-- the trip is unknown, not guessed.
UPDATE "orders" AS o
SET "estimated_minutes" = round(extract(epoch from o."estimated_delivery_at" - o."created_at") / 60)::integer
WHERE o."estimated_minutes" IS NULL
  AND o."estimated_delivery_at" IS NOT NULL
  AND o."estimated_delivery_at" >= o."created_at"
  AND NOT EXISTS (
    SELECT 1
    FROM "order_status_history" AS h
    WHERE h."order_id" = o."order_id"
      AND h."status" IN ('courier_assigned', 'picked_up', 'in_transit', 'delivered')
  );
