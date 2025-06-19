CREATE TABLE IF NOT EXISTS "l1_l2_validator_rollup_address" (
	"attester_address" varchar(42) NOT NULL,
	"rollup_address" varchar(42) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "l1_l2_validator_rollup_address_attester_address_timestamp_pk" PRIMARY KEY("attester_address","timestamp")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "l1_l2_validator_rollup_address" ADD CONSTRAINT "l1_l2_validator_rollup_address_attester_address_l1_l2_validator_attester_fk" FOREIGN KEY ("attester_address") REFERENCES "public"."l1_l2_validator"("attester") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "l1_l2_validator_rollup_address" ("attester_address", "rollup_address", "timestamp")
SELECT 
  "attester",
  '0xee6d4e937f0493fb461f28a75cf591f1dba8704e',
  "first_seen_at"
FROM "l1_l2_validator"
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "l1_l2_validator" DROP COLUMN IF EXISTS "rollup_address";