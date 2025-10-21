DO $$ BEGIN
 CREATE TYPE "public"."slot_status" AS ENUM('block-mined', 'block-proposed', 'block-missed', 'attestation-sent', 'attestation-missed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sentinel_validator_missed_attestations" (
	"attester" varchar(42) PRIMARY KEY NOT NULL,
	"last_seen_at" bigint,
	"last_seen_at_slot" bigint,
	"total" integer NOT NULL,
	"missed" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sentinel_validator_missed_blocks" (
	"attester" varchar(42) PRIMARY KEY NOT NULL,
	"last_seen_at" bigint,
	"last_seen_at_slot" bigint,
	"total" integer NOT NULL,
	"missed" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sentinel_validator_history" (
	"attester" varchar(42) NOT NULL,
	"slot" bigint NOT NULL,
	"status" "slot_status" NOT NULL,
	CONSTRAINT "sentinel_validator_history_attester_slot_pk" PRIMARY KEY("attester","slot")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sentinel_validator" (
	"attester" varchar(42) PRIMARY KEY NOT NULL,
	"last_seen_at" bigint,
	"last_seen_at_slot" bigint,
	"total_slots" integer DEFAULT 0
);
--> statement-breakpoint
DROP TABLE "l1_l2_validator_proposer";--> statement-breakpoint
DROP TABLE "l1_l2_validator_rollup_address";--> statement-breakpoint
DROP TABLE "l1_l2_validator_withdrawer";--> statement-breakpoint
DROP TABLE "tx_public_call_request";--> statement-breakpoint
ALTER TABLE "tx_effect" ALTER COLUMN "tx_time_of_birth" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_stake" ALTER COLUMN "stake" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_stake" ALTER COLUMN "stake" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_stake" ALTER COLUMN "timestamp" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_status" ALTER COLUMN "timestamp" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
ALTER TABLE "l2BlockFinalizationStatus" ALTER COLUMN "timestamp" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator" ADD COLUMN "rollup_address" varchar(42) NOT NULL;--> statement-breakpoint
ALTER TABLE "l1_l2_validator" ADD COLUMN "withdrawer" varchar(42) NOT NULL;--> statement-breakpoint
ALTER TABLE "l1_l2_validator" ADD COLUMN "proposer" varchar(42) NOT NULL;