ALTER TABLE "l2_rpc_node" ADD COLUMN "rpc_node_name" varchar;
ALTER TABLE "l2_rpc_node" ADD COLUMN "l2_network_id" varchar;
ALTER TABLE "l2_rpc_node" ADD COLUMN "rollup_version" bigint;
ALTER TABLE "l2_rpc_node" ADD COLUMN "node_version" varchar;
ALTER TABLE "l2_rpc_node" ADD COLUMN "l1_chain_id" integer;
--> statement-breakpoint
UPDATE "l2_rpc_node"
SET "rpc_node_name" = "name"
WHERE "rpc_node_name" IS NULL;
--> statement-breakpoint
UPDATE "l2_rpc_node" rpc
SET
  "l2_network_id" = seq."l2_network_id",
  "rollup_version" = seq."rollup_version",
  "node_version" = seq."node_version",
  "l1_chain_id" = seq."l1_chain_id",
  "created_at" = COALESCE(seq."created_at", rpc."created_at")
FROM "l2_sequencer" seq
WHERE seq."rpc_node_name" = rpc."name";
--> statement-breakpoint
ALTER TABLE "l2_rpc_node" ALTER COLUMN "rpc_node_name" SET NOT NULL;
ALTER TABLE "l2_rpc_node" ALTER COLUMN "last_seen_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "l2_rpc_node_error" DROP CONSTRAINT IF EXISTS "l2_rpc_node_error_rpc_node_name_l2_rpc_node_name_fk";
ALTER TABLE "l2_sequencer" DROP CONSTRAINT IF EXISTS "l2_sequencer_rpc_node_name_l2_rpc_node_name_fk";
--> statement-breakpoint
ALTER TABLE "l2_rpc_node" DROP CONSTRAINT IF EXISTS "l2_rpc_node_pkey";
ALTER TABLE "l2_rpc_node" ADD CONSTRAINT "l2_rpc_node_rpc_node_name_pk" PRIMARY KEY ("rpc_node_name");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l2_rpc_node_error"
 ADD CONSTRAINT "l2_rpc_node_error_rpc_node_name_l2_rpc_node_rpc_node_name_fk"
 FOREIGN KEY ("rpc_node_name") REFERENCES "public"."l2_rpc_node"("rpc_node_name") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "l2_rpc_node_error" DROP COLUMN IF EXISTS "rpc_node_name_old";
--> statement-breakpoint
ALTER TABLE "l2_rpc_node" DROP COLUMN "name";
DROP TABLE "l2_sequencer";
