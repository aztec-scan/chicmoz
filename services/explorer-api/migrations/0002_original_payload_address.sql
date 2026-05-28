ALTER TABLE "l1_governance_proposals" ADD COLUMN "original_payload_address" varchar(42);--> statement-breakpoint
CREATE INDEX "l1_gov_proposals_original_payload_address_idx" ON "l1_governance_proposals" USING btree ("original_payload_address");
