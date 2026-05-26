import {
  type SourceVerificationFailureStage,
  type SourceVerificationStatus,
} from "@chicmoz-pkg/types";
import {
  AlertCircle,
  CheckCircle2,
  Github,
  Loader2,
  TerminalSquare,
} from "lucide-react";
import { useEffect, useRef, type FC } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useVerifySourceJob } from "~/hooks";
import { cn } from "~/lib/utils";

const STEPS: { status: SourceVerificationStatus; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "COMPILING", label: "Compiling" },
  { status: "VERIFYING", label: "Verifying" },
  { status: "VERIFIED", label: "Verified" },
];

const getStepIndex = (status: SourceVerificationStatus): number => {
  const idx = STEPS.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
};

const FAILURE_STAGE_LABELS: Record<SourceVerificationFailureStage, string> = {
  INPUT_VALIDATION: "Input validation",
  NARGO_DISCOVERY: "Nargo discovery",
  IMAGE_RESOLUTION: "Image resolution",
  CLONE: "Clone",
  CHECKOUT: "Checkout",
  COMPILE: "Compile",
  TRANSPILATION: "Transpilation",
  ARTIFACT_DISCOVERY: "Artifact discovery",
  ARTIFACT_VERIFICATION: "Artifact verification",
  SOURCE_EXTRACTION: "Source extraction",
  TIMEOUT: "Timeout",
  INTERNAL: "Internal",
};

type JobStatusProps = {
  classId: string;
  version: string;
  jobId: string;
  onVerified?: () => void;
  onRetry?: () => void;
};

export const JobStatus: FC<JobStatusProps> = ({
  classId,
  version,
  jobId,
  onVerified,
  onRetry,
}) => {
  const {
    data: job,
    isLoading,
    error,
  } = useVerifySourceJob(classId, version, jobId);

  const status = job?.status ?? "PENDING";
  const isFailed = status === "FAILED";
  const isVerified = status === "VERIFIED";
  const currentStepIdx = getStepIndex(status);
  const hasCalledOnVerified = useRef(false);
  const failureStageLabel = job?.failureStage
    ? FAILURE_STAGE_LABELS[job.failureStage]
    : undefined;
  const shouldShowProgress = !isFailed && !isVerified;

  useEffect(() => {
    if (isVerified && onVerified && !hasCalledOnVerified.current) {
      hasCalledOnVerified.current = true;
      onVerified();
    }
  }, [isVerified, onVerified]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-gray-500 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading job status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 py-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">
            Failed to load job status: {error.message}
          </span>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {shouldShowProgress && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Verification in progress...
        </div>
      )}

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStepIdx && !isFailed;
          const isComplete = idx < currentStepIdx || isVerified;
          const isPast = idx < currentStepIdx;

          return (
            <div key={step.status} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium",
                    isComplete
                      ? "border-green-500 bg-green-500 text-white"
                      : isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500",
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 size={16} />
                  ) : isActive ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs whitespace-nowrap",
                    isComplete || isActive
                      ? "text-gray-700 dark:text-gray-200 font-medium"
                      : "text-gray-400 dark:text-gray-500",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-1 mt-[-1rem]",
                    isPast ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Failed state */}
      {isFailed && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Verification failed</span>
          </div>
          {failureStageLabel && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-red-700/70 dark:text-red-300/70">
                Stage
              </span>
              <Badge
                variant="outline"
                className="border-red-300 bg-white/70 font-mono text-[11px] text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300"
              >
                {job?.failureStage}
              </Badge>
              <span className="text-sm text-red-700 dark:text-red-300">
                {failureStageLabel}
              </span>
            </div>
          )}
          {job?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {job.error}
            </p>
          )}
          {job?.compileOutput && (
            <details className="group rounded-md border border-red-200/80 bg-white/70 dark:border-red-800/80 dark:bg-red-950/20">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300">
                <TerminalSquare size={15} />
                Compiler output
              </summary>
              <div className="border-t border-red-200/80 px-3 py-3 dark:border-red-800/80">
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-red-950 px-3 py-3 text-xs leading-5 text-red-50">
                  {job.compileOutput}
                </pre>
              </div>
            </details>
          )}
          <details className="group rounded-md border border-red-200/80 bg-white/70 dark:border-red-800/80 dark:bg-red-950/20">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300">
              <Github size={15} />
              Local repro inputs
            </summary>
            <div className="grid gap-3 border-t border-red-200/80 px-3 py-3 text-sm dark:border-red-800/80 md:grid-cols-2">
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-red-700/60 dark:text-red-300/60">
                  Repo URL
                </div>
                <div className="break-all text-red-700 dark:text-red-200">
                  {job?.githubUrl ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-red-700/60 dark:text-red-300/60">
                  Git ref
                </div>
                <div className="font-mono text-red-700 dark:text-red-200">
                  {job?.gitRef ?? "(default branch)"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-red-700/60 dark:text-red-300/60">
                  Sub-path
                </div>
                <div className="font-mono text-red-700 dark:text-red-200">
                  {job?.subPath ?? "/"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-red-700/60 dark:text-red-300/60">
                  Compiler version
                </div>
                <div className="font-mono text-red-700 dark:text-red-200">
                  {job?.aztecVersion ?? "—"}
                </div>
              </div>
            </div>
          </details>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="w-fit"
            >
              Try again
            </Button>
          )}
        </div>
      )}

      {/* Verified state */}
      {isVerified && (
        <div className="flex flex-col gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={16}
              className="text-green-600 dark:text-green-400"
            />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Source code verified successfully!
            </span>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-green-700/60 dark:text-green-300/60">
                Repo URL
              </div>
              <div className="break-all text-green-700 dark:text-green-200">
                {job?.githubUrl ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-green-700/60 dark:text-green-300/60">
                Selected ref
              </div>
              <div className="font-mono text-green-700 dark:text-green-200">
                {job?.gitRef ?? "(default branch)"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-green-700/60 dark:text-green-300/60">
                Sub-path
              </div>
              <div className="font-mono text-green-700 dark:text-green-200">
                {job?.subPath ?? "/"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-green-700/60 dark:text-green-300/60">
                Compiler version
              </div>
              <div className="font-mono text-green-700 dark:text-green-200">
                {job?.aztecVersion ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-green-700/60 dark:text-green-300/60">
                Verified commit
              </div>
              <div className="font-mono text-green-700 dark:text-green-200">
                {job?.commitHash ?? "—"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
