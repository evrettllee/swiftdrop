ALTER TABLE "orders" ADD COLUMN "assignment_round" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assignment_round_check" CHECK ("orders"."assignment_round" >= 1) NOT VALID;--> statement-breakpoint
ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_assignment_round_check";
