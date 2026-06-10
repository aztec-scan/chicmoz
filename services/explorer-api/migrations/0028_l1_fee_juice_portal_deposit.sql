CREATE TABLE IF NOT EXISTS "l1_fee_juice_portal_deposit" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "l1_block_number" bigint NOT NULL,
  "l1_block_hash" varchar NOT NULL,
  "l1_block_timestamp" numeric NOT NULL,
  "l1_contract_address" varchar NOT NULL,
  "l1_transaction_hash" varchar,
  "l1_log_index" bigint,
  "is_finalized" boolean DEFAULT false NOT NULL,
  "to" varchar NOT NULL,
  "amount" bigint NOT NULL,
  "secret_hash" varchar NOT NULL,
  "key" varchar NOT NULL,
  "index" bigint NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "l1_fee_juice_deposit_log_unique"
  ON "l1_fee_juice_portal_deposit" (
    "l1_transaction_hash",
    "l1_log_index",
    "l1_contract_address",
    "is_finalized"
  );
