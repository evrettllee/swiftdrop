CREATE TABLE "exchange_rates" (
	"currency" varchar(3) PRIMARY KEY NOT NULL,
	"rate" numeric(10, 4) NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL
);
