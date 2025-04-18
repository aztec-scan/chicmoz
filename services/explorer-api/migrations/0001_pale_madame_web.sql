ALTER TABLE "l2Block" DROP CONSTRAINT "l2Block_height_unique";--> statement-breakpoint
ALTER TABLE "l2Block" ADD COLUMN "orphan_timestamp" timestamp;--> statement-breakpoint
ALTER TABLE "l2Block" ADD COLUMN "orphan_hasOrphanedParent" boolean;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "height_idx" ON "l2Block" USING btree ("height");