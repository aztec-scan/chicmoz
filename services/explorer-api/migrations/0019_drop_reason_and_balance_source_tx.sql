ALTER TABLE "dropped_tx" ADD COLUMN "drop_reason" varchar;--> statement-breakpoint
ALTER TABLE "contract_instance_balance" ADD COLUMN "source_tx_hash" varchar;
