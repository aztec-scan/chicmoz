DO $$ BEGIN
 CREATE TYPE "public"."call_type" AS ENUM('non_revertible', 'revertible', 'teardown');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."source_verification_failure_stage" AS ENUM('INPUT_VALIDATION', 'NARGO_DISCOVERY', 'IMAGE_RESOLUTION', 'CLONE', 'CHECKOUT', 'COMPILE', 'TRANSPILATION', 'ARTIFACT_DISCOVERY', 'ARTIFACT_VERIFICATION', 'SOURCE_EXTRACTION', 'TIMEOUT', 'INTERNAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."source_verification_status" AS ENUM('PENDING', 'COMPILING', 'VERIFYING', 'VERIFIED', 'FAILED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aztec-chain-connection" (
	"hash" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"chain_height" integer NOT NULL,
	"latest_processed_height" integer NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"rpc_url" varchar NOT NULL,
	"node_version" varchar NOT NULL,
	"l1_chain_id" integer NOT NULL,
	"rollup_version" bigint NOT NULL,
	"enr" varchar,
	"l1_contract_addresses" jsonb NOT NULL,
	"protocol_contract_addresses" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contract_instance_balance" (
	"contract_address" varchar(66) NOT NULL,
	"balance" numeric(77, 0) NOT NULL,
	"timestamp" bigint NOT NULL,
	"source_tx_hash" varchar,
	CONSTRAINT "contract_instance_balance_pk" PRIMARY KEY("contract_address","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dropped_tx" (
	"tx_hash" varchar PRIMARY KEY NOT NULL,
	"created_as_pending_at" bigint NOT NULL,
	"dropped_at" bigint NOT NULL,
	"drop_reason" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tx_public_call_request" (
	"tx_hash" varchar NOT NULL,
	"msg_sender" varchar(66) NOT NULL,
	"contract_address" varchar(66) NOT NULL,
	"is_static_call" boolean NOT NULL,
	"calldata_hash" varchar NOT NULL,
	"call_type" "call_type" DEFAULT 'revertible' NOT NULL,
	"function_selector" varchar,
	"contract_name" varchar,
	"function_name" varchar,
	CONSTRAINT "tx_public_call_request_tx_hash_calldata_hash_pk" PRIMARY KEY("tx_hash","calldata_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tx_l2_to_l1_msg" (
	"tx_hash" varchar NOT NULL,
	"index" integer NOT NULL,
	"contract_address" varchar(66) NOT NULL,
	"recipient" varchar(42) NOT NULL,
	"content" varchar NOT NULL,
	CONSTRAINT "tx_l2_to_l1_msg_tx_hash_index_pk" PRIMARY KEY("tx_hash","index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_chain_info" (
	"l2_network_id" varchar PRIMARY KEY NOT NULL,
	"l1_chain_id" integer NOT NULL,
	"rollup_version" bigint NOT NULL,
	"staking_asset_symbol" varchar,
	"staking_asset_decimals" integer,
	"fee_juice_symbol" varchar,
	"fee_juice_decimals" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"l1_contract_addresses" jsonb NOT NULL,
	"protocol_contract_addresses" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_rollup_version_observation" (
	"l2_network_id" varchar NOT NULL,
	"rollup_version" varchar NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"first_seen_source" varchar NOT NULL,
	"last_seen_source" varchar NOT NULL,
	CONSTRAINT "l2_rollup_version_observation_l2_network_id_rollup_version_pk" PRIMARY KEY("l2_network_id","rollup_version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_open_gap" (
	"id" varchar PRIMARY KEY NOT NULL,
	"l2_network_id" varchar NOT NULL,
	"from_height" bigint NOT NULL,
	"to_height" bigint NOT NULL,
	"reason" varchar NOT NULL,
	"status_hint" varchar NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"last_requested_at" timestamp,
	"fulfilled_at" timestamp,
	"last_error" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_tip_boundary_mismatch" (
	"id" varchar PRIMARY KEY NOT NULL,
	"l2_network_id" varchar NOT NULL,
	"bucket" varchar NOT NULL,
	"height" bigint NOT NULL,
	"expected_hash" varchar NOT NULL,
	"observed_db_hash" varchar,
	"reason" varchar NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_tips" (
	"l2_network_id" varchar PRIMARY KEY NOT NULL,
	"proposed_block_number" bigint NOT NULL,
	"proposed_block_hash" varchar NOT NULL,
	"proposed_checkpoint_block_number" bigint,
	"proposed_checkpoint_block_hash" varchar,
	"proposed_checkpoint_number" bigint,
	"proposed_checkpoint_hash" varchar,
	"checkpointed_block_number" bigint NOT NULL,
	"checkpointed_block_hash" varchar NOT NULL,
	"checkpointed_checkpoint_number" bigint NOT NULL,
	"checkpointed_checkpoint_hash" varchar NOT NULL,
	"proven_block_number" bigint NOT NULL,
	"proven_block_hash" varchar NOT NULL,
	"proven_checkpoint_number" bigint NOT NULL,
	"proven_checkpoint_hash" varchar NOT NULL,
	"finalized_block_number" bigint NOT NULL,
	"finalized_block_hash" varchar NOT NULL,
	"finalized_checkpoint_number" bigint NOT NULL,
	"finalized_checkpoint_hash" varchar NOT NULL,
	"observed_at" bigint NOT NULL,
	"aztec_node_name" varchar,
	"aztec_node_version" varchar,
	"degraded_reason" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "body" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_hash" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public_data_write" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tx_effect_hash" varchar NOT NULL,
	"index" integer NOT NULL,
	"leaf_slot" varchar(66) NOT NULL,
	"value" varchar(66) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tx_effect" (
	"tx_hash" varchar PRIMARY KEY NOT NULL,
	"body_id" uuid NOT NULL,
	"tx_time_of_birth" bigint DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000 NOT NULL,
	"index" integer NOT NULL,
	"revert_code" smallint NOT NULL,
	"transaction_fee" numeric(77, 0) NOT NULL,
	"fee_payer" varchar(66),
	"fee_payment_method" varchar,
	"initiator" varchar(66),
	"note_hashes" jsonb NOT NULL,
	"nullifiers" jsonb NOT NULL,
	"l2_to_l1_msgs" jsonb NOT NULL,
	"private_logs" jsonb NOT NULL,
	"public_logs" jsonb NOT NULL,
	"contract_class_logs" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gas_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"global_variables_id" uuid NOT NULL,
	"fee_per_da_gas" numeric(77, 0),
	"fee_per_l2_gas" numeric(77, 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "global_variables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"header_id" uuid NOT NULL,
	"chain_id" bigint NOT NULL,
	"version" bigint NOT NULL,
	"block_number" bigint NOT NULL,
	"slot_number" bigint NOT NULL,
	"timestamp" bigint NOT NULL,
	"coinbase" varchar(42) NOT NULL,
	"fee_recipient" varchar(66) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "header" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_hash" varchar NOT NULL,
	"total_fees" numeric(77, 0) NOT NULL,
	"total_mana_used" numeric(77, 0) NOT NULL,
	"sponge_blob_hash" varchar(66) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_to_l2_message_tree" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root" varchar(66),
	"next_available_leaf_index" integer NOT NULL,
	"state_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "last_archive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root" varchar(66),
	"next_available_leaf_index" integer NOT NULL,
	"header_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "note_hash_tree" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root" varchar(66),
	"next_available_leaf_index" integer NOT NULL,
	"state_partial_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nullifier_tree" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root" varchar(66),
	"next_available_leaf_index" integer NOT NULL,
	"state_partial_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public_data_tree" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root" varchar(66),
	"next_available_leaf_index" integer NOT NULL,
	"state_partial_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"header_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_block_proposed" (
	"l1_contract_address" varchar(42) NOT NULL,
	"l2_block_number" bigint NOT NULL,
	"l1_block_number" bigint NOT NULL,
	"l1_block_hash" varchar NOT NULL,
	"l1_transaction_hash" varchar,
	"l1_block_timestamp" bigint NOT NULL,
	"is_finalized" boolean DEFAULT false,
	"archive" varchar(66) NOT NULL,
	CONSTRAINT "block_proposal" PRIMARY KEY("l2_block_number","archive")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_proof_verified" (
	"l1_contract_address" varchar(42) NOT NULL,
	"l2_block_number" bigint NOT NULL,
	"l1_block_number" bigint NOT NULL,
	"l1_block_hash" varchar NOT NULL,
	"l1_transaction_hash" varchar,
	"l1_block_timestamp" bigint NOT NULL,
	"is_finalized" boolean DEFAULT false,
	"prover_id" varchar(42) NOT NULL,
	CONSTRAINT "proof_verified" PRIMARY KEY("l2_block_number","prover_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "archive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root" varchar(66),
	"next_available_leaf_index" integer NOT NULL,
	"block_hash" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2Block" (
	"hash" varchar PRIMARY KEY NOT NULL,
	"height" bigint NOT NULL,
	"version" bigint NOT NULL,
	"orphan_timestamp" bigint,
	"orphan_hasOrphanedParent" boolean
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_contract_class_registered" (
	"block_hash" varchar NOT NULL,
	"contract_class_id" varchar(66) NOT NULL,
	"version" bigint NOT NULL,
	"artifact_hash" varchar(66) NOT NULL,
	"private_functions_root" varchar(66) NOT NULL,
	"packed_bytecode" "bytea" NOT NULL,
	"artifact_json" varchar,
	"artifact_contract_name" varchar,
	"selector_map" jsonb,
	"contract_type" varchar,
	"contract_version" varchar,
	"source_code_url" varchar,
	"source_code_commit_hash" varchar,
	"source_code" jsonb,
	CONSTRAINT "contract_class_id_version" PRIMARY KEY("contract_class_id","version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_contract_instance_aztec_scan_notes" (
	"address" varchar(66) PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"origin" varchar NOT NULL,
	"comment" varchar NOT NULL,
	"category" varchar,
	"related_l1_contract_addresses" jsonb,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_contract_instance_deployed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_hash" varchar NOT NULL,
	"address" varchar(66) NOT NULL,
	"version" integer NOT NULL,
	"salt" varchar(66) NOT NULL,
	"current_contract_class_id" varchar(66) NOT NULL,
	"original_contract_class_id" varchar(66) NOT NULL,
	"initialization_hash" varchar(66) NOT NULL,
	"deployer" varchar(66) NOT NULL,
	"masterNullifierPublicKey" varchar(130) NOT NULL,
	"masterIncomingViewingPublicKey" varchar(130) NOT NULL,
	"masterOutgoingViewingPublicKey" varchar(130) NOT NULL,
	"masterTaggingPublicKey" varchar(130) NOT NULL,
	CONSTRAINT "l2_contract_instance_deployed_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_contract_instance_deployer_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(66) NOT NULL,
	"contract_identifier" varchar NOT NULL,
	"details" varchar NOT NULL,
	"creator_name" varchar NOT NULL,
	"creator_contact" varchar NOT NULL,
	"app_url" varchar NOT NULL,
	"repo_url" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_contract_instance_update" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(66) NOT NULL,
	"prev_contract_class_id" varchar(66) NOT NULL,
	"new_contract_class_id" varchar(66) NOT NULL,
	"timestamp" bigint NOT NULL,
	"block_hash" varchar NOT NULL,
	CONSTRAINT "l2_contract_instance_update_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_contract_instance_verified_deployment_arguments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(66) NOT NULL,
	"publicKeys" varchar NOT NULL,
	"deployer" varchar(66) NOT NULL,
	"salt" varchar(66) NOT NULL,
	"constructor_args" jsonb NOT NULL,
	CONSTRAINT "verified_deployment_arguments_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_private_function" (
	"contract_class_id" varchar(66) NOT NULL,
	"artifact_metadata_hash" varchar(66) NOT NULL,
	"utility_functions_tree_root" varchar(66) NOT NULL,
	"private_function_tree_sibling_path" jsonb NOT NULL,
	"private_function_tree_leaf_index" bigint NOT NULL,
	"artifact_function_tree_sibling_path" jsonb NOT NULL,
	"artifact_function_tree_leaf_index" bigint NOT NULL,
	"private_function_selector_value" bigint NOT NULL,
	"private_function_metadata_hash" varchar(66) NOT NULL,
	"private_function_vk_hash" varchar(66) NOT NULL,
	"private_function_bytecode" "bytea" NOT NULL,
	CONSTRAINT "private_function_contract_class" PRIMARY KEY("contract_class_id","private_function_selector_value")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_utility_function" (
	"contract_class_id" varchar(66) NOT NULL,
	"artifact_metadata_hash" varchar(66) NOT NULL,
	"private_functions_artifact_tree_root" varchar(66) NOT NULL,
	"artifact_function_tree_sibling_path" jsonb NOT NULL,
	"artifact_function_tree_leaf_index" bigint NOT NULL,
	"utility_function_selector_value" bigint NOT NULL,
	"utility_function_metadata_hash" varchar(66) NOT NULL,
	"utility_function_bytecode" "bytea" NOT NULL,
	CONSTRAINT "utility_function_contract_class" PRIMARY KEY("contract_class_id","utility_function_selector_value")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "source_verification_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_class_id" text NOT NULL,
	"version" integer NOT NULL,
	"github_url" text NOT NULL,
	"git_ref" text,
	"sub_path" text,
	"aztec_version" text,
	"commit_hash" text,
	"client_ip" text,
	"status" "source_verification_status" DEFAULT 'PENDING' NOT NULL,
	"error" text,
	"failure_stage" "source_verification_failure_stage",
	"compile_output" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tx" (
	"hash" varchar PRIMARY KEY NOT NULL,
	"fee_payer" varchar(66) NOT NULL,
	"birth_timestamp" bigint NOT NULL,
	"initiator" varchar(66),
	"expiration_timestamp" integer,
	"gas_limit_da" integer,
	"gas_limit_l2" integer,
	"teardown_gas_limit_da" integer,
	"teardown_gas_limit_l2" integer,
	"max_fee_per_da_gas" numeric(77, 0),
	"max_fee_per_l2_gas" numeric(77, 0),
	"max_priority_fee_per_da_gas" numeric(77, 0),
	"max_priority_fee_per_l2_gas" numeric(77, 0),
	"gas_used_da" integer,
	"gas_used_l2" integer,
	"fee_payment_method" varchar,
	"note_hash_count" integer,
	"nullifier_count" integer,
	"l2_to_l1_msg_count" integer,
	"private_log_count" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_generic_contract_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"l1_block_hash" varchar NOT NULL,
	"l1_block_number" bigint NOT NULL,
	"l1_block_timestamp" bigint NOT NULL,
	"l1_contract_address" varchar(42) NOT NULL,
	"l1_transaction_hash" varchar,
	"l1_log_index" bigint,
	"is_finalized" boolean DEFAULT false NOT NULL,
	"event_name" varchar NOT NULL,
	"event_args" jsonb
);
--> statement-breakpoint
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
	"proposer" varchar(42),
	"governance_proposer_address" varchar(42),
	"state" varchar DEFAULT 'Pending' NOT NULL,
	"created_at" bigint NOT NULL,
	"pending_through" bigint,
	"active_through" bigint,
	"queued_through" bigint,
	"executable_through" bigint,
	"summed_yea" bigint NOT NULL,
	"summed_nay" bigint NOT NULL,
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
	"amount" bigint NOT NULL,
	"l1_block_number" bigint NOT NULL,
	"l1_block_hash" varchar NOT NULL,
	"l1_block_timestamp" bigint NOT NULL,
	"l1_transaction_hash" varchar NOT NULL,
	"l1_log_index" bigint NOT NULL,
	"is_finalized" boolean DEFAULT false NOT NULL
);
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
	"rpc_node_name" varchar PRIMARY KEY NOT NULL,
	"rpc_url" varchar NOT NULL,
	"l2_network_id" varchar,
	"rollup_version" bigint,
	"node_version" varchar,
	"l1_chain_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "l2_rpc_node_rpc_url_unique" UNIQUE("rpc_url")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "body" ADD CONSTRAINT "body_block_hash_l2Block_hash_fk" FOREIGN KEY ("block_hash") REFERENCES "public"."l2Block"("hash") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "public_data_write" ADD CONSTRAINT "public_data_write_tx_effect_hash_tx_effect_tx_hash_fk" FOREIGN KEY ("tx_effect_hash") REFERENCES "public"."tx_effect"("tx_hash") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tx_effect" ADD CONSTRAINT "tx_effect_body_id_body_id_fk" FOREIGN KEY ("body_id") REFERENCES "public"."body"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gas_fees" ADD CONSTRAINT "gas_fees_global_variables_id_global_variables_id_fk" FOREIGN KEY ("global_variables_id") REFERENCES "public"."global_variables"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "global_variables" ADD CONSTRAINT "global_variables_header_id_header_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "header" ADD CONSTRAINT "header_block_hash_l2Block_hash_fk" FOREIGN KEY ("block_hash") REFERENCES "public"."l2Block"("hash") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l1_to_l2_message_tree" ADD CONSTRAINT "l1_to_l2_message_tree_state_id_state_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "last_archive" ADD CONSTRAINT "last_archive_header_id_header_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "note_hash_tree" ADD CONSTRAINT "note_hash_tree_state_partial_id_partial_id_fk" FOREIGN KEY ("state_partial_id") REFERENCES "public"."partial"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nullifier_tree" ADD CONSTRAINT "nullifier_tree_state_partial_id_partial_id_fk" FOREIGN KEY ("state_partial_id") REFERENCES "public"."partial"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partial" ADD CONSTRAINT "partial_state_id_state_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "public_data_tree" ADD CONSTRAINT "public_data_tree_state_partial_id_partial_id_fk" FOREIGN KEY ("state_partial_id") REFERENCES "public"."partial"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "state" ADD CONSTRAINT "state_header_id_header_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "archive" ADD CONSTRAINT "archive_block_hash_l2Block_hash_fk" FOREIGN KEY ("block_hash") REFERENCES "public"."l2Block"("hash") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l2_contract_class_registered" ADD CONSTRAINT "l2_contract_class_registered_block_hash_l2Block_hash_fk" FOREIGN KEY ("block_hash") REFERENCES "public"."l2Block"("hash") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l2_contract_instance_deployed" ADD CONSTRAINT "l2_contract_instance_deployed_block_hash_l2Block_hash_fk" FOREIGN KEY ("block_hash") REFERENCES "public"."l2Block"("hash") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l2_contract_instance_deployed" ADD CONSTRAINT "contract_class" FOREIGN KEY ("current_contract_class_id","version") REFERENCES "public"."l2_contract_class_registered"("contract_class_id","version") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l2_contract_instance_deployer_metadata" ADD CONSTRAINT "l2_contract_instance_deployer_metadata_address_l2_contract_instance_deployed_address_fk" FOREIGN KEY ("address") REFERENCES "public"."l2_contract_instance_deployed"("address") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l2_contract_instance_update" ADD CONSTRAINT "l2_contract_instance_update_block_hash_l2Block_hash_fk" FOREIGN KEY ("block_hash") REFERENCES "public"."l2Block"("hash") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l2_contract_instance_verified_deployment_arguments" ADD CONSTRAINT "l2_contract_instance_verified_deployment_arguments_address_l2_contract_instance_deployed_address_fk" FOREIGN KEY ("address") REFERENCES "public"."l2_contract_instance_deployed"("address") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
 ALTER TABLE "l2_rpc_node_error" ADD CONSTRAINT "l2_rpc_node_error_rpc_node_name_l2_rpc_node_rpc_node_name_fk" FOREIGN KEY ("rpc_node_name") REFERENCES "public"."l2_rpc_node"("rpc_node_name") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "l2_open_gap_range_key" ON "l2_open_gap" USING btree ("l2_network_id","from_height","to_height","reason");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "l2_tip_boundary_mismatch_key" ON "l2_tip_boundary_mismatch" USING btree ("l2_network_id","bucket","height","expected_hash","observed_db_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "body_block_hash_idx" ON "body" USING btree ("block_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_data_write_tx_effect_hash_idx" ON "public_data_write" USING btree ("tx_effect_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_data_write_index_idx" ON "public_data_write" USING btree ("index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_data_write_tx_effect_hash_index_idx" ON "public_data_write" USING btree ("tx_effect_hash","index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tx_hash_index" ON "tx_effect" USING btree ("tx_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tx_effect_body_id_idx" ON "tx_effect" USING btree ("body_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tx_effect_index_idx" ON "tx_effect" USING btree ("index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tx_effect_body_id_index_idx" ON "tx_effect" USING btree ("body_id","index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gas_fees_global_variables_id_idx" ON "gas_fees" USING btree ("global_variables_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "global_variables_header_id_idx" ON "global_variables" USING btree ("header_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "global_variables_version_idx" ON "global_variables" USING btree ("version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "header_block_hash_idx" ON "header" USING btree ("block_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partial_state_id_idx" ON "partial" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "state_header_id_idx" ON "state" USING btree ("header_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "height_idx" ON "l2Block" USING btree ("height");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l2block_version_idx" ON "l2Block" USING btree ("version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l2block_height_version_idx" ON "l2Block" USING btree ("height","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orphan_timestamp_idx" ON "l2Block" USING btree ("orphan_timestamp") WHERE "l2Block"."orphan_timestamp" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "height_orphan_idx" ON "l2Block" USING btree ("height","orphan_timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "l1_generic_event_log_unique" ON "l1_generic_contract_event" USING btree ("l1_transaction_hash","l1_log_index","l1_contract_address","is_finalized");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "l1_gov_proposals_proposal_id_unique" ON "l1_governance_proposals" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_proposals_state_idx" ON "l1_governance_proposals" USING btree ("state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_proposals_created_at_idx" ON "l1_governance_proposals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_proposals_payload_address_idx" ON "l1_governance_proposals" USING btree ("payload_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_signals_payload_address_idx" ON "l1_governance_signals" USING btree ("payload_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_signals_round_idx" ON "l1_governance_signals" USING btree ("round");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_signals_signaler_idx" ON "l1_governance_signals" USING btree ("signaler");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "l1_gov_signals_log_unique" ON "l1_governance_signals" USING btree ("l1_transaction_hash","l1_log_index","is_finalized");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_votes_proposal_id_idx" ON "l1_governance_votes" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_gov_votes_voter_idx" ON "l1_governance_votes" USING btree ("voter");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "l1_gov_votes_log_unique" ON "l1_governance_votes" USING btree ("l1_transaction_hash","l1_log_index","is_finalized");