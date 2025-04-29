CREATE TABLE IF NOT EXISTS "dropped_tx" (
	"tx_hash" varchar PRIMARY KEY NOT NULL,
	"reason" varchar NOT NULL,
	"previous_state" varchar NOT NULL,
	"orphaned_tx_effect_hash" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"dropped_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dropped_tx" ADD CONSTRAINT "dropped_tx_orphaned_tx_effect_hash_tx_effect_tx_hash_fk" FOREIGN KEY ("orphaned_tx_effect_hash") REFERENCES "public"."tx_effect"("tx_hash") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
