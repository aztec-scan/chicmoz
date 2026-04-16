ALTER TABLE "tx_effect" ALTER COLUMN "transaction_fee" SET DATA TYPE numeric(77, 0) USING "transaction_fee"::numeric;--> statement-breakpoint
ALTER TABLE "gas_fees" ALTER COLUMN "fee_per_da_gas" SET DATA TYPE numeric(77, 0) USING "fee_per_da_gas"::numeric;--> statement-breakpoint
ALTER TABLE "gas_fees" ALTER COLUMN "fee_per_l2_gas" SET DATA TYPE numeric(77, 0) USING "fee_per_l2_gas"::numeric;
