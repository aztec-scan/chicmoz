DO $$ BEGIN
 CREATE TYPE "public"."slot_status" AS ENUM('block-mined', 'block-proposed', 'block-missed', 'attestation-sent', 'attestation-missed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator_proposer" (
	"attester_address" varchar(42) NOT NULL,
	"proposer" varchar(42) NOT NULL,
	"timestamp" bigint DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000 NOT NULL,
	CONSTRAINT "l1_l2_validator_proposer_attester_address_timestamp_pk" PRIMARY KEY("attester_address","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator_rollup_address" (
	"attester_address" varchar(42) NOT NULL,
	"rollup_address" varchar(42) NOT NULL,
	"timestamp" bigint DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000 NOT NULL,
	CONSTRAINT "l1_l2_validator_rollup_address_attester_address_timestamp_pk" PRIMARY KEY("attester_address","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator_stake" (
	"attester_address" varchar(42) NOT NULL,
	"stake" numeric(77, 0) NOT NULL,
	"timestamp" bigint DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000 NOT NULL,
	CONSTRAINT "l1_l2_validator_stake_attester_address_timestamp_pk" PRIMARY KEY("attester_address","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator_status" (
	"attester_address" varchar(42) NOT NULL,
	"status" smallint NOT NULL,
	"timestamp" bigint DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000 NOT NULL,
	CONSTRAINT "l1_l2_validator_status_attester_address_timestamp_pk" PRIMARY KEY("attester_address","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator" (
	"attester" varchar(42) PRIMARY KEY NOT NULL,
	"first_seen_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator_withdrawer" (
	"attester_address" varchar(42) NOT NULL,
	"withdrawer" varchar(42) NOT NULL,
	"timestamp" bigint DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000 NOT NULL,
	CONSTRAINT "l1_l2_validator_withdrawer_attester_address_timestamp_pk" PRIMARY KEY("attester_address","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sentinel_validator_missed_attestations" (
	"attester" varchar(42) PRIMARY KEY NOT NULL,
	"last_seen_at" bigint,
	"last_seen_at_slot" bigint,
	"total" integer NOT NULL,
	"missed" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sentinel_validator_missed_blocks" (
	"attester" varchar(42) PRIMARY KEY NOT NULL,
	"last_seen_at" bigint,
	"last_seen_at_slot" bigint,
	"total" integer NOT NULL,
	"missed" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sentinel_validator_history" (
	"attester" varchar(42) NOT NULL,
	"slot" bigint NOT NULL,
	"status" "slot_status" NOT NULL,
	CONSTRAINT "sentinel_validator_history_attester_slot_pk" PRIMARY KEY("attester","slot")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sentinel_validator" (
	"attester" varchar(42) PRIMARY KEY NOT NULL,
	"last_seen_at" bigint,
	"last_seen_at_slot" bigint,
	"total_slots" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_chain_info" (
	"l2_network_id" varchar PRIMARY KEY NOT NULL,
	"l1_chain_id" integer NOT NULL,
	"rollup_version" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"l1_contract_addresses" jsonb NOT NULL,
	"protocol_contract_addresses" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_rpc_node_error" (
	"name" varchar PRIMARY KEY NOT NULL,
	"rpc_node_name" varchar NOT NULL,
	"cause" varchar NOT NULL,
	"message" varchar NOT NULL,
	"stack" varchar NOT NULL,
	"data" jsonb NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_rpc_node" (
	"name" varchar PRIMARY KEY NOT NULL,
	"rpc_url" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now(),
	CONSTRAINT "l2_rpc_node_rpc_url_unique" UNIQUE("rpc_url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_sequencer" (
	"enr" varchar PRIMARY KEY NOT NULL,
	"rpc_node_name" varchar NOT NULL,
	"l2_network_id" varchar NOT NULL,
	"rollup_version" bigint NOT NULL,
	"node_version" varchar NOT NULL,
	"l1_chain_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l1_l2_validator_proposer" ADD CONSTRAINT "l1_l2_validator_proposer_attester_address_l1_l2_validator_attester_fk" FOREIGN KEY ("attester_address") REFERENCES "public"."l1_l2_validator"("attester") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l1_l2_validator_rollup_address" ADD CONSTRAINT "l1_l2_validator_rollup_address_attester_address_l1_l2_validator_attester_fk" FOREIGN KEY ("attester_address") REFERENCES "public"."l1_l2_validator"("attester") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l1_l2_validator_stake" ADD CONSTRAINT "l1_l2_validator_stake_attester_address_l1_l2_validator_attester_fk" FOREIGN KEY ("attester_address") REFERENCES "public"."l1_l2_validator"("attester") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l1_l2_validator_status" ADD CONSTRAINT "l1_l2_validator_status_attester_address_l1_l2_validator_attester_fk" FOREIGN KEY ("attester_address") REFERENCES "public"."l1_l2_validator"("attester") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l1_l2_validator_withdrawer" ADD CONSTRAINT "l1_l2_validator_withdrawer_attester_address_l1_l2_validator_attester_fk" FOREIGN KEY ("attester_address") REFERENCES "public"."l1_l2_validator"("attester") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
