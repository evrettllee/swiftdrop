CREATE TYPE "public"."service_name" AS ENUM('osrm', 'nbrb', 'mail', 'stripe', 'server');--> statement-breakpoint
CREATE TABLE "service_failures" (
	"failure_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "service_failures_failure_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"service" "service_name" NOT NULL,
	"code" varchar(64) NOT NULL,
	"message" varchar(300) NOT NULL,
	"first_at" timestamp with time zone NOT NULL,
	"last_at" timestamp with time zone NOT NULL,
	"repeats" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "service_failures_repeats_check" CHECK ("service_failures"."repeats" >= 1)
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "promised_delivery_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "zone_id" integer;--> statement-breakpoint
CREATE INDEX "service_failures_last_at_idx" ON "service_failures" USING btree ("last_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "service_failures_service_code_last_at_idx" ON "service_failures" USING btree ("service","code","last_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_zone_id_service_zones_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("zone_id") ON DELETE no action ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_zone_id_service_zones_zone_id_fk";--> statement-breakpoint
CREATE INDEX "orders_status_finished_at_idx" ON "orders" USING btree ("status","finished_at");--> statement-breakpoint
CREATE INDEX "order_status_history_status_changed_at_idx" ON "order_status_history" USING btree ("status","changed_at");--> statement-breakpoint
CREATE INDEX "payments_refunded_at_idx" ON "payments" USING btree ("refunded_at") WHERE "payments"."refunded_at" IS NOT NULL;