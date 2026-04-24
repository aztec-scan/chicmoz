DO $$ BEGIN
 CREATE TYPE "public"."source_verification_failure_stage" AS ENUM('INPUT_VALIDATION', 'CLONE', 'CHECKOUT', 'COMPILE', 'TRANSPILATION', 'ARTIFACT_DISCOVERY', 'ARTIFACT_VERIFICATION', 'SOURCE_EXTRACTION', 'TIMEOUT', 'INTERNAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "source_verification_jobs" ADD COLUMN "failure_stage" "source_verification_failure_stage";--> statement-breakpoint
ALTER TABLE "source_verification_jobs" ADD COLUMN "compile_output" text;