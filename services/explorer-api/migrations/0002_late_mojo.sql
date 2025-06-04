CREATE TABLE IF NOT EXISTS "contract_instance_balance" (
	"contract_address" varchar(66) NOT NULL,
	"balance" bigint NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contract_instance_balance_pk" PRIMARY KEY("contract_address","timestamp")
);
--> statement-breakpoint
ALTER TABLE "dropped_tx" RENAME COLUMN "created_at" TO "created_as_pending_at";--> statement-breakpoint
ALTER TABLE "tx" ALTER COLUMN "birth_timestamp" DROP DEFAULT;--> statement-breakpoint
-- TODO: drop all entries in tx before adding the new column
DELETE FROM "tx"; -->  statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "fee_payer" varchar(66) NOT NULL;
