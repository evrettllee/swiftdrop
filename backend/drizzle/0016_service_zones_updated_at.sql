ALTER TABLE "service_zones" ALTER COLUMN "name" SET DATA TYPE varchar(80);--> statement-breakpoint
ALTER TABLE "service_zones" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "service_zones" ADD CONSTRAINT "service_zones_name_length_check" CHECK (char_length("service_zones"."name") BETWEEN 1 AND 80);
