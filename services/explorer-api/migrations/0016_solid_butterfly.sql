ALTER TYPE "public"."source_verification_failure_stage" ADD VALUE IF NOT EXISTS 'NARGO_DISCOVERY';--> statement-breakpoint
ALTER TYPE "public"."source_verification_failure_stage" ADD VALUE IF NOT EXISTS 'IMAGE_RESOLUTION';--> statement-breakpoint
ALTER TABLE "source_verification_jobs" ALTER COLUMN "aztec_version" DROP NOT NULL;
