ALTER TABLE "header" ALTER COLUMN "total_fees" SET DATA TYPE numeric(77, 0) USING "total_fees"::numeric;--> statement-breakpoint
ALTER TABLE "header" ALTER COLUMN "total_mana_used" SET DATA TYPE numeric(77, 0) USING "total_mana_used"::numeric;
