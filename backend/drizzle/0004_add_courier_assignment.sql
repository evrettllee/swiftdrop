DROP INDEX "order_offers_order_id_idx";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "otp_failed_attempts" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "otp_locked_until" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "courier_profiles_available_location_idx" ON "courier_profiles" USING btree ("location_updated_at") WHERE "courier_profiles"."is_available";--> statement-breakpoint
CREATE UNIQUE INDEX "orders_one_active_per_courier_uidx" ON "orders" USING btree ("courier_id") WHERE "orders"."status" IN ('courier_assigned', 'picked_up', 'in_transit');--> statement-breakpoint
CREATE UNIQUE INDEX "order_offers_order_courier_uidx" ON "order_offers" USING btree ("order_id","courier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_offers_one_pending_per_order_uidx" ON "order_offers" USING btree ("order_id") WHERE "order_offers"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "order_offers_one_accepted_per_order_uidx" ON "order_offers" USING btree ("order_id") WHERE "order_offers"."status" = 'accepted';--> statement-breakpoint
CREATE UNIQUE INDEX "order_offers_one_pending_per_courier_uidx" ON "order_offers" USING btree ("courier_id") WHERE "order_offers"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "order_offers_pending_expires_at_idx" ON "order_offers" USING btree ("expires_at") WHERE "order_offers"."status" = 'pending';--> statement-breakpoint
ALTER TABLE "courier_profiles" ADD CONSTRAINT "courier_profiles_location_pair_check" CHECK (("courier_profiles"."current_lat" IS NULL) = ("courier_profiles"."current_lng" IS NULL)
        AND ("courier_profiles"."current_lat" IS NULL) = ("courier_profiles"."location_updated_at" IS NULL));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_otp_code_check" CHECK ("orders"."otp_code" ~ '^[0-9]{4}$');--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_otp_failed_attempts_check" CHECK ("orders"."otp_failed_attempts" >= 0);--> statement-breakpoint
ALTER TABLE "order_offers" ADD CONSTRAINT "order_offers_eta_check" CHECK ("order_offers"."pickup_eta_sec" >= 0 AND "order_offers"."total_eta_sec" >= "order_offers"."pickup_eta_sec");