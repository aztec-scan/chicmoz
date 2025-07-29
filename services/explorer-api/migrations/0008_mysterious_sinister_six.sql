ALTER TABLE "contract_instance_balance" ALTER COLUMN "timestamp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "contract_instance_balance" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "dropped_tx" ALTER COLUMN "created_as_pending_at" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "created_as_pending_at") * 1000;--> statement-breakpoint
ALTER TABLE "dropped_tx" ALTER COLUMN "dropped_at" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "dropped_at") * 1000;--> statement-breakpoint
ALTER TABLE "tx_effect" ALTER COLUMN "tx_time_of_birth" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tx_effect" ALTER COLUMN "tx_time_of_birth" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "tx_time_of_birth") * 1000;--> statement-breakpoint
ALTER TABLE "tx_effect" ALTER COLUMN "tx_time_of_birth" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_block_proposed" ALTER COLUMN "l1_block_timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "l1_block_timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_proof_verified" ALTER COLUMN "l1_block_timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "l1_block_timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "l2Block" ALTER COLUMN "orphan_timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "orphan_timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "tx" ALTER COLUMN "birth_timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "birth_timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "l1_generic_contract_event" ALTER COLUMN "l1_block_timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "l1_block_timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_proposer" ALTER COLUMN "timestamp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_proposer" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_proposer" ALTER COLUMN "timestamp" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_rollup_address" ALTER COLUMN "timestamp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_rollup_address" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_rollup_address" ALTER COLUMN "timestamp" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_stake" ALTER COLUMN "timestamp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_stake" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_stake" ALTER COLUMN "timestamp" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_status" ALTER COLUMN "timestamp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_status" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_status" ALTER COLUMN "timestamp" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator" ALTER COLUMN "first_seen_at" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "first_seen_at") * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_withdrawer" ALTER COLUMN "timestamp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_withdrawer" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "l1_l2_validator_withdrawer" ALTER COLUMN "timestamp" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
ALTER TABLE "l2BlockFinalizationStatus" ALTER COLUMN "timestamp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "l2BlockFinalizationStatus" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "l2BlockFinalizationStatus" ALTER COLUMN "timestamp" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;--> statement-breakpoint
UPDATE global_variables
SET timestamp = CASE
  WHEN timestamp <= 9999999999 THEN timestamp * 1000
  ELSE timestamp
END;