CREATE TABLE "courier_shifts" (
	"shift_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "courier_shifts_shift_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"courier_id" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "courier_shifts_period_check" CHECK ("courier_shifts"."ended_at" >= "courier_shifts"."started_at")
);
--> statement-breakpoint
ALTER TABLE "courier_shifts" ADD CONSTRAINT "courier_shifts_courier_id_courier_profiles_courier_profile_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."courier_profiles"("courier_profile_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "courier_shifts_one_open_per_courier_uidx" ON "courier_shifts" USING btree ("courier_id") WHERE "courier_shifts"."ended_at" IS NULL;--> statement-breakpoint
CREATE INDEX "courier_shifts_courier_started_at_idx" ON "courier_shifts" USING btree ("courier_id","started_at");--> statement-breakpoint
INSERT INTO "courier_shifts" ("courier_id", "started_at") SELECT "courier_profile_id", now() FROM "courier_profiles" WHERE "is_available";
