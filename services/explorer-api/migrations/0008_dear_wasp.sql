ALTER TABLE "l1_l2_block_proposed" ALTER COLUMN "l1_block_timestamp" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "l1_l2_proof_verified" ALTER COLUMN "l1_block_timestamp" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "l1_generic_contract_event" ALTER COLUMN "l1_block_timestamp" SET DATA TYPE bigint;