-- Clear all existing data before schema migration
DELETE FROM "l2_rpc_node_error";
--> statement-breakpoint
DELETE FROM "l2_sequencer";
--> statement-breakpoint
DELETE FROM "l2_rpc_node";
--> statement-breakpoint
ALTER TABLE "l2_rpc_node_error" DROP CONSTRAINT "l2_rpc_node_error_rpc_node_id_l2_rpc_node_id_fk";
--> statement-breakpoint
ALTER TABLE "l2_sequencer" DROP CONSTRAINT "l2_sequencer_rpc_node_id_l2_rpc_node_id_fk";
--> statement-breakpoint
ALTER TABLE "l2_rpc_node_error" ADD COLUMN "rpc_node_name" varchar NOT NULL;
--> statement-breakpoint
-- Drop the existing primary key constraint on id column
ALTER TABLE "l2_rpc_node" DROP CONSTRAINT "l2_rpc_node_pkey";
--> statement-breakpoint
-- Add name column without PRIMARY KEY first
ALTER TABLE "l2_rpc_node" ADD COLUMN "name" varchar NOT NULL;
--> statement-breakpoint
-- Add primary key constraint on name column
ALTER TABLE "l2_rpc_node" ADD CONSTRAINT "l2_rpc_node_pkey" PRIMARY KEY ("name");
--> statement-breakpoint
ALTER TABLE "l2_sequencer" ADD COLUMN "rpc_node_name" varchar NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l2_rpc_node_error" ADD CONSTRAINT "l2_rpc_node_error_rpc_node_name_l2_rpc_node_name_fk" FOREIGN KEY ("rpc_node_name") REFERENCES "public"."l2_rpc_node"("name") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l2_sequencer" ADD CONSTRAINT "l2_sequencer_rpc_node_name_l2_rpc_node_name_fk" FOREIGN KEY ("rpc_node_name") REFERENCES "public"."l2_rpc_node"("name") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "l2_rpc_node_error" DROP COLUMN IF EXISTS "rpc_node_id";
--> statement-breakpoint
ALTER TABLE "l2_rpc_node" DROP COLUMN IF EXISTS "id";
--> statement-breakpoint
ALTER TABLE "l2_sequencer" DROP COLUMN IF EXISTS "rpc_node_id";
