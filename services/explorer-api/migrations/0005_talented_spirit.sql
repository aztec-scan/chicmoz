-- Add column as nullable first
ALTER TABLE "l1_l2_validator" ADD COLUMN "rollup_address" varchar(42);

-- Update existing rows with appropriate values
UPDATE "l1_l2_validator" SET "rollup_address" = '0x8d1cc702453fa889f137dbd5734cdb7ee96b6ba0'; -- Current rollup address as time of writing

-- Add the NOT NULL constraint
ALTER TABLE "l1_l2_validator" ALTER COLUMN "rollup_address" SET NOT NULL;
