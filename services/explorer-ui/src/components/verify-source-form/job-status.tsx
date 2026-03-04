import { type SourceVerificationStatus } from "@chicmoz-pkg/types";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { type FC } from "react";
import { cn } from "~/lib/utils";
import { useVerifySourceJob } from "~/hooks";
import { Button } from "~/components/ui/button";

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

  if (isVerified && onVerified) {
    // Delay callback to avoid render-during-render
    setTimeout(() => {
      onVerified();
    }, 0);
  }

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
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Verification in progress...
      </div>

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
          {job?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {job.error}
            </p>
          )}
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
        <div className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <CheckCircle2
            size={16}
            className="text-green-600 dark:text-green-400"
          />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Source code verified successfully!
          </span>
        </div>
      )}
    </div>
  );
};
