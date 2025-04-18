# Handling Re-orgs in the Explorer API

## Current Implementation

- The L2Block schema uses the block hash as the primary key and has a unique constraint on the height.
- When a re-org occurs, the current implementation deletes the old block and replaces it with the new one.
- This approach loses the information about the orphaned chain, making it unavailable for troubleshooting.

## Chosen Solution: Add orphan-related fields to the L2Block schema

### Implementation Details

1. Modify the l2Block table in root.ts:

   ```typescript
   export const l2Block = pgTable(
     "l2Block",
     {
       hash: varchar("hash").primaryKey().notNull().$type<HexString>(),
       height: bigint("height", { mode: "bigint" }).notNull(),
       orphan_timestamp: timestamp("orphan_timestamp"),
       orphan_hasOrphanedParent: boolean("orphan_hasOrphanedParent"),
     },
     (t) => ({
       heightIdx: index("height_idx").on(t.height),
     }),
   );
   ```

2. Update the ChicmozL2Block type in packages/types/src/aztec/l2Block.ts:

   ```typescript
   export const chicmozL2BlockSchema = z.object({
     // ... existing fields ...
     orphan: z
       .object({
         timestamp: z.date(),
         hasOrphanedParent: z.boolean(),
       })
       .optional(),
   });
   ```

3. Remove the unique constraint on height (if it exists)

4. Update the block storage logic:

   - When storing a new block, check if a block with the same height already exists (but different hash)
   - If it does, update the existing block's orphan_timestamp and set orphan_hasOrphanedParent to false
   - If it does, update the existing block in the database with orphan_timestamp and set orphan_hasOrphanedParent to false
     - Then update all the blocks in the database with an higher height AND orphan_timstamp === null
       - Set orphan_timestamp to the current time
       - Set orphan_hasOrphanedParent to true
   - For the new block being added, set orphan_timestamp to null and orphan_hasOrphanedParent to false, then store to DB

5. Update block retrieval logic:

   - all retreival functions using l2Block schema should be updated to only retreive blocks with orphan_timestamp === null
   - double-check that indeed all used functions are updated, this is IMPORTANT

6. Update API endpoints:

   - add two new endpoints to retrieve orphaned blocks
     - GET /l2/blocks/orphaned
       - Returns all blocks with orphan_timestamp not null, make sure to sort them like latestBlocks-endpoint
     - GET /l2/reorgs
       - returns a list of reorgs, each containing below (sorted by timestamp):
         - orphanedBlockHash
         - height
         - timestamp
         - nbrOfOrphanedBlocks
       - ensure that this type is added to packages/types
   - edit existing endpoint to include orphaned blocks in the response
     - GET /l2/blocks/:blockHash
       - If the block is orphaned, include the following fields in the response. (Otherwise `.orphan` is undefined)
         - orphan: {
           timestamp: Date,
           hasOrphanedParent: boolean
           }

7. Update the explorer UI:
   - On the block details page, display the orphan status and timestamp
   - Add a separate section for reorgs giving an overview of reorgs and links to their orphaned blocks

## Advantages of this approach

- Preserves all block data, including orphaned blocks
- Allows for easy querying of both main chain and orphaned blocks
- Provides information about the orphan status and timing
- Maintains backward compatibility with existing queries by using optional fields

## Next steps

1. Implement the type changes in `packages/types/src/aztec/l2Block.ts`
2. run `cd ~/c/chicmoz/packages/types && yarn build` until it works
3. Update the block processing logic in \`services/explorer-api/src/events/received/on-block/index.ts\`
4. run `cd ~/c/chicmoz/services/explorer-api && yarn build` until it works
5. Implement the schema changes in the database
6. Modify block retrieval functions to filter out orphaned blocks
7. run `cd ~/c/chicmoz/services/explorer-api && yarn build` until it works
8. add the new API endpoints to the explorer API
9. prompt user to run the migration script to update the database schema
10. Update the explorer UI to display orphan information
11. run `cd ~/c/chicmoz/services/explorer-ui && yarn build` until it works
12. Update documentation to reflect the new behavior and available data
