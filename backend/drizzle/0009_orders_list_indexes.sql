CREATE INDEX "orders_client_created_at_idx" ON "orders" USING btree ("client_id","created_at" DESC NULLS FIRST,"order_id" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "orders_courier_finished_at_idx" ON "orders" USING btree ("courier_id","finished_at" DESC NULLS FIRST,"order_id" DESC NULLS FIRST) WHERE "orders"."status" IN ('delivered', 'cancelled');--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at" DESC NULLS FIRST,"order_id" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "orders_status_created_at_idx" ON "orders" USING btree ("status","created_at" DESC NULLS FIRST,"order_id" DESC NULLS FIRST);--> statement-breakpoint
DROP INDEX "orders_status_idx";
