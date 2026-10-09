ALTER TABLE "payments" ADD COLUMN "amount_usd" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "exchange_rate" numeric(10, 4) NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "checkout_session_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_checkoutSessionId_unique" UNIQUE("checkout_session_id");