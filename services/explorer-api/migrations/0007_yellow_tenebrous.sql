-- First add the column as nullable
ALTER TABLE "l2Block" ADD COLUMN "version" bigint;--> statement-breakpoint

-- Populate the version column from existing data
UPDATE "l2Block" 
SET "version" = (
  SELECT gv."version" 
  FROM "header" h 
  INNER JOIN "global_variables" gv ON h."id" = gv."header_id" 
  WHERE h."block_hash" = "l2Block"."hash"
);--> statement-breakpoint

-- Make the column NOT NULL after populating data
ALTER TABLE "l2Block" ALTER COLUMN "version" SET NOT NULL;--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "l2block_version_idx" ON "l2Block" USING btree ("version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l2block_height_version_idx" ON "l2Block" USING btree ("height","version");