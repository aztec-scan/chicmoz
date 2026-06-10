CREATE TABLE IF NOT EXISTS "l1_governance_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"configuration" jsonb NOT NULL,
	"updated_at" bigint NOT NULL,
	"l1_block_number" bigint NOT NULL,
	"l1_block_hash" varchar NOT NULL,
	"l1_block_timestamp" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_governance_payload_rounds" (
	"payload_address" varchar(42) NOT NULL,
	"round" bigint NOT NULL,
	"signal_count" bigint NOT NULL,
	"is_submittable" boolean DEFAULT false NOT NULL,
	"is_submitted" boolean DEFAULT false NOT NULL,
	"winning_payload" boolean DEFAULT false NOT NULL,
	CONSTRAINT "l1_governance_payload_rounds_payload_address_round_pk" PRIMARY KEY("payload_address","round")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_governance_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" varchar(78) NOT NULL,
	"payload_address" varchar(42) NOT NULL,
	"original_payload_address" varchar(42),
	"proposer" varchar(42),
	"governance_proposer_address" varchar(42),
	"state" varchar DEFAULT 'Pending' NOT NULL,
	"cached_state" varchar DEFAULT 'Pending',
	"created_at" bigint NOT NULL,
	"pending_through" bigint,
	"active_through" bigint,
	"queued_through" bigint,
	"executable_through" bigint,
	"summed_yea" numeric(78, 0) NOT NULL,
	"summed_nay" numeric(78, 0) NOT NULL,
	"snapshot_total_power" numeric(78, 0),
	"votes_needed" numeric(78, 0),
	"executed_at" bigint,
	"dropped_at" bigint,
	"configuration" jsonb,
	"uri" varchar,
	"metadata" jsonb,
	"l1_block_number" bigint NOT NULL,
	"l1_block_hash" varchar NOT NULL,
	"l1_block_timestamp" bigint NOT NULL,
	"l1_transaction_hash" varchar,
	"is_finalized" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_governance_proposer_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"governance_proposer_address" varchar(42) NOT NULL,
	"updated_at" bigint NOT NULL,
	"l1_block_number" bigint NOT NULL,
	"l1_block_hash" varchar NOT NULL,
	"l1_block_timestamp" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_governance_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payload_address" varchar(42) NOT NULL,
	"round" bigint NOT NULL,
	"signaler" varchar(42) NOT NULL,
	"l1_block_number" bigint NOT NULL,
	"l1_block_hash" varchar NOT NULL,
	"l1_block_timestamp" bigint NOT NULL,
	"l1_transaction_hash" varchar NOT NULL,
	"l1_log_index" bigint NOT NULL,
	"is_finalized" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_governance_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" varchar(78) NOT NULL,
	"voter" varchar(42) NOT NULL,
	"support" boolean NOT NULL,
	"amount" numeric(78, 0) NOT NULL,
	"l1_block_number" bigint NOT NULL,
	"l1_block_hash" varchar NOT NULL,
	"l1_block_timestamp" bigint NOT NULL,
	"l1_transaction_hash" varchar NOT NULL,
	"l1_log_index" bigint NOT NULL,
	"is_finalized" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "l1_gov_proposals_proposal_id_unique" ON "l1_governance_proposals" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_proposals_state_idx" ON "l1_governance_proposals" USING btree ("state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_proposals_created_at_idx" ON "l1_governance_proposals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_proposals_payload_address_idx" ON "l1_governance_proposals" USING btree ("payload_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_proposals_original_payload_address_idx" ON "l1_governance_proposals" USING btree ("original_payload_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_signals_payload_address_idx" ON "l1_governance_signals" USING btree ("payload_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_signals_round_idx" ON "l1_governance_signals" USING btree ("round");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_signals_signaler_idx" ON "l1_governance_signals" USING btree ("signaler");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "l1_gov_signals_log_unique" ON "l1_governance_signals" USING btree ("l1_transaction_hash","l1_log_index","is_finalized");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_votes_proposal_id_idx" ON "l1_governance_votes" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_votes_voter_idx" ON "l1_governance_votes" USING btree ("voter");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "l1_gov_votes_log_unique" ON "l1_governance_votes" USING btree ("l1_transaction_hash","l1_log_index","is_finalized");
