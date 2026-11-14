ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "first_assigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "first_assigned_auto" boolean;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_first_assignment_check" CHECK (("orders"."first_assigned_at" IS NULL) = ("orders"."first_assigned_auto" IS NULL)) NOT VALID;--> statement-breakpoint
UPDATE "orders" SET "paid_at" = "confirmed"."paid_at"
FROM (
  SELECT "order_id", min("changed_at") AS "paid_at"
  FROM "order_status_history"
  WHERE "status" = 'confirmed'
  GROUP BY "order_id"
) AS "confirmed"
WHERE "confirmed"."order_id" = "orders"."order_id";--> statement-breakpoint
UPDATE "orders" SET
  "first_assigned_at" = "first"."changed_at",
  "first_assigned_auto" = coalesce("accepted_courier"."user_id" = "first"."changed_by", false)
FROM (
  SELECT DISTINCT ON ("order_id") "order_id", "changed_at", "changed_by"
  FROM "order_status_history"
  WHERE "status" = 'courier_assigned'
  ORDER BY "order_id", "changed_at", "status_history_id"
) AS "first"
LEFT JOIN "order_offers" AS "accepted_offer"
  ON "accepted_offer"."order_id" = "first"."order_id" AND "accepted_offer"."status" = 'accepted'
LEFT JOIN "courier_profiles" AS "accepted_courier"
  ON "accepted_courier"."courier_profile_id" = "accepted_offer"."courier_id"
WHERE "first"."order_id" = "orders"."order_id";--> statement-breakpoint
ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_first_assignment_check";--> statement-breakpoint
CREATE INDEX "orders_first_assigned_at_idx" ON "orders" USING btree ("first_assigned_at");
