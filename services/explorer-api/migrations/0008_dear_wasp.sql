ALTER TABLE "l1_l2_block_proposed" ALTER COLUMN "l1_block_timestamp" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "l1_l2_proof_verified" ALTER COLUMN "l1_block_timestamp" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "l1_generic_contract_event" ALTER COLUMN "l1_block_timestamp" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "contract_instance_balance" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp");--> statement-breakpoint
ALTER TABLE "l1_l2_validator_proposer" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp");--> statement-breakpoint
ALTER TABLE "l1_l2_validator_rollup_address" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp");--> statement-breakpoint
ALTER TABLE "l1_l2_validator_stake" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp");--> statement-breakpoint
ALTER TABLE "l1_l2_validator_status" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp");--> statement-breakpoint
ALTER TABLE "l1_l2_validator_withdrawer" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp");--> statement-breakpoint
ALTER TABLE "l2Block" ALTER COLUMN "orphan_timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "orphan_timestamp");--> statement-breakpoint
ALTER TABLE "l2BlockFinalizationStatus" ALTER COLUMN "timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "timestamp");--> statement-breakpoint
ALTER TABLE "tx" ALTER COLUMN "birth_timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "birth_timestamp");