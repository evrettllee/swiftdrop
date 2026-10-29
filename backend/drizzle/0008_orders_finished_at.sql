ALTER TABLE "orders" ADD COLUMN "finished_at" timestamp with time zone;--> statement-breakpoint
UPDATE "orders" AS o
SET "finished_at" = h."finished_at"
FROM (
  SELECT "order_id", "status", max("changed_at") AS "finished_at"
  FROM "order_status_history"
  WHERE "status" IN ('delivered', 'cancelled', 'rejected')
  GROUP BY "order_id", "status"
) AS h
WHERE h."order_id" = o."order_id"
  AND h."status" = o."status"
  AND o."finished_at" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_finished_at_check" CHECK ("orders"."status" NOT IN ('delivered', 'cancelled', 'rejected') OR "orders"."finished_at" IS NOT NULL) NOT VALID;--> statement-breakpoint
ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_finished_at_check";
