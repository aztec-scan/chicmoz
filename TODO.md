# Handling Re-orgs in the Explorer API

## Current Implementation

- The L2Block schema uses the block hash as the primary key and has a unique constraint on the height.
- When a re-org occurs, the current implementation deletes the old block and replaces it with the new one.
- This approach loses the information about the orphaned chain, making it unavailable for troubleshooting.

## Proposed Solutions

### 1. Add an 'isOrphaned' field to the L2Block schema

Pros:

- Simple to implement
- Allows for easy filtering of the main chain vs orphaned blocks

Cons:

- May complicate queries that assume one block per height
- Requires updating all queries to filter out orphaned blocks

Implementation:

1. Modify the l2Block table in root.ts:
   ```typescript
   export const l2Block = pgTable(
     "l2Block",
     {
       hash: varchar("hash").primaryKey().notNull().<HexString>(),
       height: bigint("height", { mode: "bigint" }).notNull(),
       isOrphaned: boolean("is_orphaned").notNull().default(false),
     },
     (t) => ({
       heightIdx: index("height_idx").on(t.height),
     })
   );
   ```
2. Remove the unique constraint on height
3. Update the block storage logic to set isOrphaned=true on the old block instead of deleting it
4. Update all queries to filter out orphaned blocks unless explicitly requested

### 2. Create a separate table for orphaned blocks

Pros:

- Keeps the main chain clean and queries simple
- Allows for easy access to orphaned blocks when needed

Cons:

- Requires more storage
- Slightly more complex to implement

Implementation:

1. Create a new table for orphaned blocks:
   ```typescript
   export const orphanedL2Block = pgTable(
     "orphanedL2Block",
     {
       hash: varchar("hash").primaryKey().notNull().<HexString>(),
       height: bigint("height", { mode: "bigint" }).notNull(),
       orphanedAt: timestamp("orphaned_at").notNull().defaultNow(),
     }
   );
   ```
2. When a re-org occurs, move the old block to the orphanedL2Block table instead of deleting it
3. Implement a new API endpoint or query parameter to allow fetching orphaned blocks when needed

### 3. Implement a chain history table

Pros:

- Provides a complete history of all chain reorganizations
- Allows for advanced analysis of network behavior

Cons:

- More complex to implement and maintain
- Requires more storage

Implementation:

1. Create a new table for chain history:
   ```typescript
   export const chainHistory = pgTable(
     "chainHistory",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       blockHash: varchar("block_hash").notNull().<HexString>(),
       height: bigint("height", { mode: "bigint" }).notNull(),
       parentHash: varchar("parent_hash").notNull().<HexString>(),
       status: varchar("status").notNull(), // 'main', 'orphaned'
       createdAt: timestamp("created_at").notNull().defaultNow(),
       orphanedAt: timestamp("orphaned_at"),
     }
   );
   ```
2. Update the block processing logic to maintain this history table
3. Implement queries to reconstruct the chain state at any point in time

## Recommendation

Option 2 (Create a separate table for orphaned blocks) provides a good balance between simplicity and functionality. It keeps the main chain queries clean while still preserving information about orphaned blocks for troubleshooting purposes.

Next steps:

1. Implement the chosen solution
2. Update the block processing logic in `services/explorer-api/src/events/received/on-block/index.ts`
3. Add new API endpoints or query parameters to access orphaned block data
4. Update documentation to reflect the new behavior and available data
5. Consider implementing a cleanup job to remove very old orphaned blocks if storage becomes an issue
