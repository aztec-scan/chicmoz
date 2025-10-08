CREATE TABLE IF NOT EXISTS "slots" (
	"network_id" varchar PRIMARY KEY NOT NULL,
	"last_processed_slot" bigint NOT NULL
);
