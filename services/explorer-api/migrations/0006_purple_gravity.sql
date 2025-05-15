CREATE INDEX IF NOT EXISTS "body_block_hash_idx" ON "body" USING btree ("block_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_data_write_tx_effect_hash_idx" ON "public_data_write" USING btree ("tx_effect_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_data_write_index_idx" ON "public_data_write" USING btree ("index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_data_write_tx_effect_hash_index_idx" ON "public_data_write" USING btree ("tx_effect_hash","index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tx_effect_body_id_idx" ON "tx_effect" USING btree ("body_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tx_effect_index_idx" ON "tx_effect" USING btree ("index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tx_effect_body_id_index_idx" ON "tx_effect" USING btree ("body_id","index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_commitment_header_id_idx" ON "content_commitment" USING btree ("header_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gas_fees_global_variables_id_idx" ON "gas_fees" USING btree ("global_variables_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "global_variables_header_id_idx" ON "global_variables" USING btree ("header_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "header_block_hash_idx" ON "header" USING btree ("block_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partial_state_id_idx" ON "partial" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "state_header_id_idx" ON "state" USING btree ("header_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orphan_timestamp_idx" ON "l2Block" USING btree ("orphan_timestamp") WHERE "l2Block"."orphan_timestamp" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "height_orphan_idx" ON "l2Block" USING btree ("height","orphan_timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l2_block_finalization_l2blockhash_idx" ON "l2BlockFinalizationStatus" USING btree ("l2_block_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l2_block_finalization_status_idx" ON "l2BlockFinalizationStatus" USING btree ("status");