DO $$ BEGIN
 CREATE TYPE "public"."source_verification_status" AS ENUM('PENDING', 'COMPILING', 'VERIFYING', 'VERIFIED', 'FAILED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "source_verification_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_class_id" text NOT NULL,
	"version" integer NOT NULL,
	"github_url" text NOT NULL,
	"git_ref" text,
	"sub_path" text,
	"aztec_version" text NOT NULL,
	"commit_hash" text,
	"status" "source_verification_status" DEFAULT 'PENDING' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "l2_contract_class_registered" ADD COLUMN "source_code_commit_hash" varchar;--> statement-breakpoint
ALTER TABLE "l2_contract_class_registered" ADD COLUMN "source_code" jsonb;