ALTER TABLE "txs_table" ALTER COLUMN "birth_timestamp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "txs_table" ALTER COLUMN "birth_timestamp" SET DATA TYPE bigint USING EXTRACT(EPOCH FROM "birth_timestamp") * 1000;--> statement-breakpoint
ALTER TABLE "txs_table" ALTER COLUMN "birth_timestamp" SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;