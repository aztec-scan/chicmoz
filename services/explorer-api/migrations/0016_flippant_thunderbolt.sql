DO $$ BEGIN
 CREATE TYPE "public"."call_type" AS ENUM('non_revertible', 'revertible', 'teardown');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tx_public_call_request" (
	"tx_hash" varchar NOT NULL,
	"msg_sender" varchar(66) NOT NULL,
	"contract_address" varchar(66) NOT NULL,
	"is_static_call" boolean NOT NULL,
	"calldata_hash" varchar NOT NULL,
	"call_type" "call_type" DEFAULT 'revertible' NOT NULL,
	"function_selector" varchar,
	CONSTRAINT "tx_public_call_request_tx_hash_calldata_hash_pk" PRIMARY KEY("tx_hash","calldata_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tx_l2_to_l1_msg" (
	"tx_hash" varchar NOT NULL,
	"index" integer NOT NULL,
	"contract_address" varchar(66) NOT NULL,
	"recipient" varchar(42) NOT NULL,
	"content" varchar NOT NULL,
	CONSTRAINT "tx_l2_to_l1_msg_tx_hash_index_pk" PRIMARY KEY("tx_hash","index")
);
--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "initiator" varchar(66);--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "expiration_timestamp" integer;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "gas_limit_da" integer;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "gas_limit_l2" integer;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "teardown_gas_limit_da" integer;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "teardown_gas_limit_l2" integer;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "max_fee_per_da_gas" numeric(77, 0);--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "max_fee_per_l2_gas" numeric(77, 0);--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "max_priority_fee_per_da_gas" numeric(77, 0);--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "max_priority_fee_per_l2_gas" numeric(77, 0);--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "gas_used_da" integer;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "gas_used_l2" integer;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "fee_payment_method" varchar;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "note_hash_count" integer;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "nullifier_count" integer;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "l2_to_l1_msg_count" integer;--> statement-breakpoint
ALTER TABLE "tx" ADD COLUMN "private_log_count" integer;
--> statement-breakpoint
ALTER TABLE "tx_effect" ADD COLUMN "fee_payer" varchar(66);
--> statement-breakpoint
ALTER TABLE "tx_effect" ADD COLUMN "fee_payment_method" varchar(32);
--> statement-breakpoint
ALTER TABLE "tx_effect" ADD COLUMN "initiator" varchar(66);
