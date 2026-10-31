CREATE INDEX "users_full_name_trgm_idx" ON "users" USING gin (("first_name" || ' ' || "last_name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "users_email_trgm_idx" ON "users" USING gin ("email" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "orders_recipient_name_trgm_idx" ON "orders" USING gin ("recipient_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "orders_recipient_phone_idx" ON "orders" USING btree ("recipient_phone");