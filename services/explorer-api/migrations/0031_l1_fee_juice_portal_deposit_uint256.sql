ALTER TABLE "l1_fee_juice_portal_deposit" ALTER COLUMN "amount" SET DATA TYPE numeric(77, 0) USING "amount"::numeric;--> statement-breakpoint
ALTER TABLE "l1_fee_juice_portal_deposit" ALTER COLUMN "index" SET DATA TYPE numeric(77, 0) USING "index"::numeric;
