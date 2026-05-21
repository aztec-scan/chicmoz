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

CREATE UNIQUE INDEX IF NOT EXISTS "l2_open_gap_range_key" ON "l2_open_gap" ("l2_network_id","from_height","to_height","reason");

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

CREATE UNIQUE INDEX IF NOT EXISTS "l2_tip_boundary_mismatch_key" ON "l2_tip_boundary_mismatch" ("l2_network_id","bucket","height","expected_hash","observed_db_hash");
