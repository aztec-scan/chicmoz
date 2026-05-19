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
INSERT INTO "l2_rollup_version_observation" (
	"l2_network_id",
	"rollup_version",
	"first_seen_at",
	"last_seen_at",
	"first_seen_source",
	"last_seen_source"
)
WITH migration_network AS (
	SELECT COALESCE(
		(SELECT "l2_network_id" FROM "l2_chain_info" LIMIT 1),
		CASE
			WHEN current_database() = 'explorer_api_mainnet' THEN 'MAINNET'
			WHEN current_database() = 'explorer_api_testnet' THEN 'TESTNET'
			WHEN current_database() IN (
				'explorer_api_devnet',
				'explorer_api_local_devnet',
				'explorer_api_remote_devnet'
			) THEN 'DEVNET'
			ELSE 'SANDBOX'
		END
	) AS "l2_network_id"
)
SELECT
	COALESCE(rpc."l2_network_id", migration_network."l2_network_id"),
	rpc."rollup_version"::text,
	MAX(rpc."last_seen_at"),
	MAX(rpc."last_seen_at"),
	'node-info',
	'node-info'
FROM "l2_rpc_node" rpc
CROSS JOIN migration_network
WHERE rpc."rollup_version" IS NOT NULL
GROUP BY 1, 2
ON CONFLICT ("l2_network_id", "rollup_version") DO UPDATE SET
	"last_seen_at" = EXCLUDED."last_seen_at",
	"last_seen_source" = EXCLUDED."last_seen_source";
--> statement-breakpoint
INSERT INTO "l2_rollup_version_observation" (
	"l2_network_id",
	"rollup_version",
	"first_seen_at",
	"last_seen_at",
	"first_seen_source",
	"last_seen_source"
)
SELECT
	"l2_network_id",
	"rollup_version"::text,
	"updated_at",
	"updated_at",
	'chain-info',
	'chain-info'
FROM "l2_chain_info"
ON CONFLICT ("l2_network_id", "rollup_version") DO UPDATE SET
	"last_seen_at" = GREATEST("l2_rollup_version_observation"."last_seen_at", EXCLUDED."last_seen_at"),
	"last_seen_source" = EXCLUDED."last_seen_source";
