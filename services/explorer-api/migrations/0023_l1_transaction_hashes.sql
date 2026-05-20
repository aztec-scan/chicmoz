ALTER TABLE "l1_l2_block_proposed"
  ADD COLUMN IF NOT EXISTS "l1_transaction_hash" varchar;
--> statement-breakpoint

ALTER TABLE "l1_l2_proof_verified"
  ADD COLUMN IF NOT EXISTS "l1_transaction_hash" varchar;
--> statement-breakpoint

ALTER TABLE "l1_generic_contract_event"
  ADD COLUMN IF NOT EXISTS "l1_log_index" bigint;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "l1_generic_event_log_unique"
  ON "l1_generic_contract_event" (
    "l1_transaction_hash",
    "l1_log_index",
    "l1_contract_address",
    "is_finalized"
  );
