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
	"rollup_version" integer NOT NULL,
	"enr" varchar,
	"l1_contract_addresses" jsonb NOT NULL,
	"protocol_contract_addresses" jsonb NOT NULL
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
	"tx_time_of_birth" timestamp DEFAULT now() NOT NULL,
	"index" integer NOT NULL,
	"revert_code" smallint NOT NULL,
	"transaction_fee" bigint NOT NULL,
	"note_hashes" jsonb NOT NULL,
	"nullifiers" jsonb NOT NULL,
	"l2_to_l1_msgs" jsonb NOT NULL,
	"contract_class_logs_length" bigint NOT NULL,
	"private_logs" jsonb NOT NULL,
	"public_logs" jsonb NOT NULL,
	"contract_class_logs" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_commitment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"header_id" uuid NOT NULL,
	"num_txs" bigint NOT NULL,
	"blobs_hash" "bytea" NOT NULL,
	"in_hash" "bytea" NOT NULL,
	"out_hash" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gas_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"global_variables_id" uuid NOT NULL,
	"fee_per_da_gas" bigint,
	"fee_per_l2_gas" bigint
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
	"total_fees" bigint NOT NULL,
	"total_mana_used" bigint NOT NULL
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
CREATE TABLE IF NOT EXISTS "l1L2BlockProposed" (
	"l1ContractAddress" varchar NOT NULL,
	"l2BlockNumber" bigint NOT NULL,
	"l1BlockNumber" bigint NOT NULL,
	"l1BlockTimestamp" timestamp NOT NULL,
	"l1BlockHash" varchar NOT NULL,
	"isFinalized" boolean DEFAULT false,
	"archive" varchar(66) NOT NULL,
	CONSTRAINT "block_proposal" PRIMARY KEY("l2BlockNumber","archive")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1L2ProofVerified" (
	"l1ContractAddress" varchar NOT NULL,
	"l2BlockNumber" bigint NOT NULL,
	"l1BlockNumber" bigint NOT NULL,
	"l1BlockTimestamp" timestamp NOT NULL,
	"l1BlockHash" varchar NOT NULL,
	"isFinalized" boolean DEFAULT false,
	"proverId" varchar(66) NOT NULL,
	CONSTRAINT "proof_verified" PRIMARY KEY("l2BlockNumber","proverId")
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
	CONSTRAINT "l2Block_height_unique" UNIQUE("height")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tx" (
	"hash" varchar PRIMARY KEY NOT NULL,
	"birth_timestamp" timestamp DEFAULT now() NOT NULL
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
	"contract_type" varchar,
	CONSTRAINT "contract_class_id_version" PRIMARY KEY("contract_class_id","version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_contract_instance_aztec_scan_notes" (
	"address" varchar(66) PRIMARY KEY NOT NULL,
	"origin" varchar NOT NULL,
	"comment" varchar NOT NULL,
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
	"previous_contract_class_id" varchar(66) NOT NULL,
	"new_contract_class_id" varchar(66) NOT NULL,
	"height" bigint NOT NULL,
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
	"constructor_args" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_private_function" (
	"contract_class_id" varchar(66) NOT NULL,
	"artifact_metadata_hash" varchar(66) NOT NULL,
	"utility_functions_artifact_tree_root" varchar(66) NOT NULL,
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
CREATE TABLE IF NOT EXISTS "l1_generic_contract_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"l1_block_hash" varchar NOT NULL,
	"l1_block_number" bigint NOT NULL,
	"l1_block_timestamp" timestamp NOT NULL,
	"l1_contract_address" varchar(42) NOT NULL,
	"l1_transaction_hash" varchar,
	"is_finalized" boolean DEFAULT false NOT NULL,
	"event_name" varchar NOT NULL,
	"event_args" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator_proposer" (
	"attester_address" varchar(42) NOT NULL,
	"proposer" varchar(42) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "l1_l2_validator_proposer_attester_address_timestamp_pk" PRIMARY KEY("attester_address","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator_stake" (
	"attester_address" varchar(42) NOT NULL,
	"stake" numeric(77, 0) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "l1_l2_validator_stake_attester_address_timestamp_pk" PRIMARY KEY("attester_address","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator_status" (
	"attester_address" varchar(42) NOT NULL,
	"status" smallint NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "l1_l2_validator_status_attester_address_timestamp_pk" PRIMARY KEY("attester_address","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator" (
	"attester" varchar(42) PRIMARY KEY NOT NULL,
	"first_seen_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l1_l2_validator_withdrawer" (
	"attester_address" varchar(42) NOT NULL,
	"withdrawer" varchar(42) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "l1_l2_validator_withdrawer_attester_address_timestamp_pk" PRIMARY KEY("attester_address","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_chain_info" (
	"l2_network_id" varchar PRIMARY KEY NOT NULL,
	"l1_chain_id" integer NOT NULL,
	"rollup_version" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"l1_contract_addresses" jsonb NOT NULL,
	"protocol_contract_addresses" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_rpc_node_error" (
	"name" varchar PRIMARY KEY NOT NULL,
	"rpc_node_id" uuid NOT NULL,
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
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rpc_url" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now(),
	CONSTRAINT "l2_rpc_node_rpc_url_unique" UNIQUE("rpc_url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2_sequencer" (
	"enr" varchar PRIMARY KEY NOT NULL,
	"rpc_node_id" uuid NOT NULL,
	"l2_network_id" varchar NOT NULL,
	"rollup_version" integer NOT NULL,
	"node_version" varchar NOT NULL,
	"l1_chain_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "l2BlockFinalizationStatus" (
	"l2_block_hash" varchar NOT NULL,
	"l2_block_number" bigint NOT NULL,
	"status" smallint NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "l2_block_finalization_status_pk" PRIMARY KEY("l2_block_hash","status","l2_block_number")
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
 ALTER TABLE "content_commitment" ADD CONSTRAINT "content_commitment_header_id_header_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "l2_rpc_node_error" ADD CONSTRAINT "l2_rpc_node_error_rpc_node_id_l2_rpc_node_id_fk" FOREIGN KEY ("rpc_node_id") REFERENCES "public"."l2_rpc_node"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l2_sequencer" ADD CONSTRAINT "l2_sequencer_rpc_node_id_l2_rpc_node_id_fk" FOREIGN KEY ("rpc_node_id") REFERENCES "public"."l2_rpc_node"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tx_hash_index" ON "tx_effect" USING btree ("tx_hash");