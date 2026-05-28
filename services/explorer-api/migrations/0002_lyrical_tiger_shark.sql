CREATE TABLE IF NOT EXISTS "contract_instance_balance" (
	"contract_address" varchar(66) NOT NULL,
	"balance" numeric(77, 0) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contract_instance_balance_pk" PRIMARY KEY("contract_address","timestamp")
);
--> statement-breakpoint
ALTER TABLE "tx" ALTER COLUMN "birth_timestamp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "dropped_tx" ADD COLUMN "created_as_pending_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "fee_payer" varchar(66) NOT NULL;--> statement-breakpoint
ALTER TABLE "dropped_tx" DROP COLUMN IF EXISTS "created_at";