-- Custom SQL migration file, put you code below! --

-- Create a temporary table to store the existing data
CREATE TEMPORARY TABLE tmp_l2BlockFinalizationStatus AS
SELECT * FROM "l2BlockFinalizationStatus";

-- Delete all data from the original table
DELETE FROM "l2BlockFinalizationStatus";

-- Insert back with updated status values
INSERT INTO "l2BlockFinalizationStatus" ("l2_block_hash", "l2_block_number", "status", "timestamp")
SELECT
    "l2_block_hash",
    "l2_block_number",
    CASE
        WHEN "status" = 1 THEN 3  -- L2_NODE_SEEN_PROVEN: 1 -> 3
        WHEN "status" = 2 THEN 1  -- L1_SEEN_PROPOSED: 2 -> 1
        WHEN "status" = 3 THEN 4  -- L1_SEEN_PROVEN: 3 -> 4
        WHEN "status" = 4 THEN 2  -- L1_MINED_PROPOSED: 4 -> 2
        ELSE "status"             -- Keep 0 and 5 the same
    END AS "status",
    "timestamp"
FROM tmp_l2BlockFinalizationStatus;

-- Drop the temporary table
DROP TABLE tmp_l2BlockFinalizationStatus;

-- Add a comment explaining the migration
COMMENT ON TABLE "l2BlockFinalizationStatus" IS 'Block finalization status table with corrected status ordering:
0 = L2_NODE_SEEN_PROPOSED
1 = L1_SEEN_PROPOSED (was 2)
2 = L1_MINED_PROPOSED (was 4)
3 = L2_NODE_SEEN_PROVEN (was 1)
4 = L1_SEEN_PROVEN (was 3)
5 = L1_MINED_PROVEN';
