CREATE TYPE "public"."token_kind" AS ENUM('invite', 'reset');--> statement-breakpoint
CREATE TYPE "public"."admin_action" AS ENUM('staff_invited', 'invite_resent', 'user_updated', 'role_changed', 'password_reset', 'sessions_ended', 'user_blocked', 'user_unblocked', 'user_deleted', 'staff_purged', 'tariff_created', 'tariff_updated', 'tariff_enabled', 'tariff_disabled');--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"admin_action_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_actions_admin_action_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"actor_id" integer NOT NULL,
	"target_user_id" integer,
	"tariff_id" integer,
	"action" "admin_action" NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_actions_subject_check" CHECK ("admin_actions"."target_user_id" IS NOT NULL OR "admin_actions"."tariff_id" IS NOT NULL OR "admin_actions"."action" = 'staff_purged')
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN "kind" "token_kind" DEFAULT 'reset' NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "tariffs" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_actor_id_users_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_user_id_users_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_tariff_id_tariffs_tariff_id_fk" FOREIGN KEY ("tariff_id") REFERENCES "public"."tariffs"("tariff_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_actions_target_user_idx" ON "admin_actions" USING btree ("target_user_id","created_at" DESC NULLS LAST) WHERE "admin_actions"."target_user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "admin_actions_tariff_idx" ON "admin_actions" USING btree ("tariff_id","created_at" DESC NULLS LAST) WHERE "admin_actions"."tariff_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "admin_actions_actor_idx" ON "admin_actions" USING btree ("actor_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_created_by_users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_role_created_idx" ON "users" USING btree ("role_id","created_at" DESC NULLS LAST,"user_id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "password_reset_tokens_active_idx" ON "password_reset_tokens" USING btree ("user_id","kind") WHERE "password_reset_tokens"."used_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tariffs_name_lower_uidx" ON "tariffs" USING btree (lower("name"));--> statement-breakpoint
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_price_per_km_check" CHECK ("tariffs"."price_per_km" > 0 AND "tariffs"."price_per_km" <= 1000) NOT VALID;--> statement-breakpoint
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_price_per_kg_check" CHECK ("tariffs"."price_per_kg" >= 0 AND "tariffs"."price_per_kg" <= 1000) NOT VALID;--> statement-breakpoint
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_min_price_check" CHECK ("tariffs"."min_price" > 0 AND "tariffs"."min_price" <= 1000) NOT VALID;--> statement-breakpoint
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_fragile_fee_check" CHECK ("tariffs"."fragile_fee" >= 0 AND "tariffs"."fragile_fee" <= 1000) NOT VALID;--> statement-breakpoint
ALTER TABLE "tariffs" VALIDATE CONSTRAINT "tariffs_price_per_km_check";--> statement-breakpoint
ALTER TABLE "tariffs" VALIDATE CONSTRAINT "tariffs_price_per_kg_check";--> statement-breakpoint
ALTER TABLE "tariffs" VALIDATE CONSTRAINT "tariffs_min_price_check";--> statement-breakpoint
ALTER TABLE "tariffs" VALIDATE CONSTRAINT "tariffs_fragile_fee_check";