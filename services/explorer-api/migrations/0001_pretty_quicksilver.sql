ALTER TABLE "l1_governance_proposals" ALTER COLUMN "summed_yea" SET DATA TYPE numeric(78, 0);--> statement-breakpoint
ALTER TABLE "l1_governance_proposals" ALTER COLUMN "summed_nay" SET DATA TYPE numeric(78, 0);--> statement-breakpoint
ALTER TABLE "l1_governance_votes" ALTER COLUMN "amount" SET DATA TYPE numeric(78, 0);--> statement-breakpoint
ALTER TABLE "l1_governance_proposals" ADD COLUMN "cached_state" varchar DEFAULT 'Pending';--> statement-breakpoint
ALTER TABLE "l1_governance_proposals" ADD COLUMN "snapshot_total_power" numeric(78, 0);--> statement-breakpoint
ALTER TABLE "l1_governance_proposals" ADD COLUMN "votes_needed" numeric(78, 0);--> statement-breakpoint
UPDATE "l1_governance_proposals" SET "cached_state" = "state" WHERE "cached_state" IS NULL;--> statement-breakpoint
UPDATE "l1_governance_proposals"
SET
  "proposer" = '0x06Ef1DcF87E419C48B94a331B252819FADbD63ef',
  "governance_proposer_address" = '0x06Ef1DcF87E419C48B94a331B252819FADbD63ef',
  "state" = 'Executed',
  "cached_state" = 'Executed',
  "pending_through" = 1773629543000,
  "active_through" = 1774234343000,
  "queued_through" = 1774839143000,
  "executable_through" = 1775443943000,
  "summed_yea" = 797550546610000000000000000,
  "summed_nay" = 0,
  "snapshot_total_power" = 799588101636901014525246387,
  "votes_needed" = 159917620327380202905049278,
  "configuration" = '{"votingDelay":"259200","votingDuration":"604800","executionDelay":"604800","gracePeriod":"604800","quorum":"200000000000000000","requiredYeaMargin":"330000000000000000","minimumVotes":"100000000000000000000000000"}'::jsonb
WHERE
  "proposal_id" = '2'
  AND "payload_address" = '0x17582A82755B32132028e4410B491A2FdB3Ec380'
  AND "l1_transaction_hash" = '0xf9a657cf382b24007c1592c42394a7971f363305341be702f93acb63ac2bec51';--> statement-breakpoint
UPDATE "l1_governance_proposals"
SET
  "proposer" = '0x06Ef1DcF87E419C48B94a331B252819FADbD63ef',
  "governance_proposer_address" = '0x06Ef1DcF87E419C48B94a331B252819FADbD63ef',
  "state" = CASE WHEN "executed_at" IS NOT NULL THEN "state" ELSE 'Queued' END,
  "cached_state" = 'Pending',
  "pending_through" = 1778827955000,
  "active_through" = 1779432755000,
  "queued_through" = 1782024755000,
  "executable_through" = 1782629555000,
  "summed_yea" = 709004000000000000000000000,
  "summed_nay" = 0,
  "snapshot_total_power" = 711310343908998014525243317,
  "votes_needed" = 142262068781799602905048664,
  "configuration" = '{"votingDelay":"259200","votingDuration":"604800","executionDelay":"2592000","gracePeriod":"604800","quorum":"200000000000000000","requiredYeaMargin":"330000000000000000","minimumVotes":"100000000000000000000000000"}'::jsonb
WHERE
  "proposal_id" = '3'
  AND "payload_address" = '0xa156E3a14f45099ecdF9C6A393a118809C5d06e6'
  AND "l1_transaction_hash" = '0x3e941f3347c53a634e1a619f52738da347621ab4f6abed52c0698d47458944ed';--> statement-breakpoint
INSERT INTO "l1_governance_votes" ("proposal_id", "voter", "support", "amount", "l1_block_number", "l1_block_hash", "l1_block_timestamp", "l1_transaction_hash", "l1_log_index", "is_finalized") VALUES
  ('2', '0xa92ecFD0E70c9cd5E5cd76c50Af0F7Da93567a4f', true, 400000000000000000000000, 24668269, '0x7ea03b87f7cca8f7173dca3ca40a8235997515da96ed002362bd2beb0ac7b0cd', 1773642443000, '0xd822363e27300c2a545248737f97be80e31777e5c2fd34cc2e62f41382ae83fd', 241, true),
  ('2', '0xa92ecFD0E70c9cd5E5cd76c50Af0F7Da93567a4f', true, 796890000000000000000000000, 24668269, '0x7ea03b87f7cca8f7173dca3ca40a8235997515da96ed002362bd2beb0ac7b0cd', 1773642443000, '0xd822363e27300c2a545248737f97be80e31777e5c2fd34cc2e62f41382ae83fd', 242, true),
  ('2', '0x79f975ed4c988fd5d096D92f42Ea4Ef17F0d2Db4', true, 50000000000000000000, 24676821, '0x9c0f5619c3f6112a747e71568a2c27bdede051cca711c4592d18f8e9336e6d03', 1773745703000, '0xf962fc9d9a69048d7917bbf17f2dff8b88f90178e722b8827d96cd000ab6d4d0', 435, true),
  ('2', '0x79f975ed4c988fd5d096D92f42Ea4Ef17F0d2Db4', true, 50000000000000000000, 24676852, '0x4c5c8dc4f97f307961a591eb35999babc5de95a4b2031e75e2ca00ce9f081ae8', 1773746075000, '0x2585ac91b16308a6bd0a4acc57005c9f861f459a20f3aed7849652d6c14876b4', 280, true),
  ('2', '0x33d66941465aC776C38096CB1BC496c673aE7390', true, 159466610000000000000000, 24677322, '0x36602456258ee48e25b8b2d8b0315992a581293ce5947783c23cefd7b546527c', 1773751751000, '0x33e48b3c75fbaae09dc28682768c6a16d0afbb740dc161b1d3739cee1a444c04', 888, true),
  ('2', '0x3ffac9214A00b45548F6a18D8429dbf5da358952', true, 100880000000000000000000, 24705614, '0xb9311811aafc7ae39fd8c75a9e97cb0f4d6ffddbb69f544fbf3eaac974aefd43', 1774092875000, '0x63e0270da533c34e5dfeb44c9cddb6dcdf672c339ffcc6726d3fb5f96d872d0a', 555, true),
  ('2', '0xc536e83e818d112b10507Af9e3Ed221Ba1D7746F', true, 100000000000000000000, 24708311, '0x610ed0efda0e86b93f91f1ca5632d44cdf4dc0e80bb0bac16d3231c3f0fa9e3e', 1774125383000, '0x6d61bec3bc9aae1b18a808b85b1ba5392f5e15d61ac6eaa481ed6cf7f9eec193', 153, true),
  ('3', '0xa92ecFD0E70c9cd5E5cd76c50Af0F7Da93567a4f', true, 0, 25121633, '0x289fb725f0e06fa22d4d15f03d2efb47a014b9c258f4746e492e8415336b0d53', 1779101819000, '0xa77b5cb6aaf1877385b717182f6e3ce2079cec4fd29b6ad22d833e48b721f127', 229, true),
  ('3', '0xa92ecFD0E70c9cd5E5cd76c50Af0F7Da93567a4f', true, 709004000000000000000000000, 25121633, '0x289fb725f0e06fa22d4d15f03d2efb47a014b9c258f4746e492e8415336b0d53', 1779101819000, '0xa77b5cb6aaf1877385b717182f6e3ce2079cec4fd29b6ad22d833e48b721f127', 230, true)
ON CONFLICT ("l1_transaction_hash", "l1_log_index", "is_finalized") DO UPDATE SET
  "proposal_id" = EXCLUDED."proposal_id",
  "voter" = EXCLUDED."voter",
  "support" = EXCLUDED."support",
  "amount" = EXCLUDED."amount",
  "l1_block_number" = EXCLUDED."l1_block_number",
  "l1_block_hash" = EXCLUDED."l1_block_hash",
  "l1_block_timestamp" = EXCLUDED."l1_block_timestamp";
