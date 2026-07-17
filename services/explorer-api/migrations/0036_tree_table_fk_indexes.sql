CREATE INDEX IF NOT EXISTS "archive_block_hash_idx" ON "archive" USING btree ("block_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "last_archive_header_id_idx" ON "last_archive" USING btree ("header_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "l1_to_l2_message_tree_state_id_idx" ON "l1_to_l2_message_tree" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_hash_tree_state_partial_id_idx" ON "note_hash_tree" USING btree ("state_partial_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nullifier_tree_state_partial_id_idx" ON "nullifier_tree" USING btree ("state_partial_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_data_tree_state_partial_id_idx" ON "public_data_tree" USING btree ("state_partial_id");