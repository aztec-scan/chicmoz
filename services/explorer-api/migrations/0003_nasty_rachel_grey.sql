-- Step 1: Add column as nullable
ALTER TABLE "l2_contract_instance_aztec_scan_notes" ADD COLUMN "name" varchar NULL;

-- Step 2: Populate existing records with data 
-- Use origin if it exists, otherwise use 'Unknown'
UPDATE "l2_contract_instance_aztec_scan_notes" 
SET "name" = COALESCE(origin, 'Unknown');

-- Step 3: Add NOT NULL constraint
ALTER TABLE "l2_contract_instance_aztec_scan_notes" ALTER COLUMN "name" SET NOT NULL;
