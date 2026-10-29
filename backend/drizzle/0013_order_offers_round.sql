ALTER TABLE "order_offers" ADD COLUMN "round" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "order_offers_order_courier_round_uidx" ON "order_offers" USING btree ("order_id","courier_id","round");--> statement-breakpoint
DROP INDEX "order_offers_order_courier_uidx";--> statement-breakpoint
ALTER TABLE "order_offers" ADD CONSTRAINT "order_offers_round_check" CHECK ("order_offers"."round" >= 1) NOT VALID;--> statement-breakpoint
ALTER TABLE "order_offers" VALIDATE CONSTRAINT "order_offers_round_check";
