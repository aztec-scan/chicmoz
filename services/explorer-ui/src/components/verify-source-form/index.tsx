import { AlertCircle, Github } from "lucide-react";
import { useState, type FC, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useSubmitSourceVerification } from "~/hooks";
import { ApiError } from "~/api/client";
import { JobStatus } from "./job-status";

type VerifySourceFormProps = {
  classId: string;
  version: string;
  onSuccess?: () => void;
};

const GITHUB_URL_PATTERN =
  /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?\/?$/;

export const VerifySourceForm: FC<VerifySourceFormProps> = ({
  classId,
  version,
  onSuccess,
}) => {
  const [githubUrl, setGithubUrl] = useState("");
  const [gitRef, setGitRef] = useState("");
  const [subPath, setSubPath] = useState("");
  const [aztecVersion, setAztecVersion] = useState("4.0.3");
  const [jobId, setJobId] = useState<string | null>(null);

  const mutation = useSubmitSourceVerification(classId, version);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!githubUrl.trim()) {
      toast.error("GitHub URL is required");
      return;
    }

    if (!GITHUB_URL_PATTERN.test(githubUrl.trim())) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }

    mutation.mutate(
      {
        githubUrl: githubUrl.trim(),
        gitRef: gitRef.trim() || undefined,
        subPath: subPath.trim() || undefined,
        aztecVersion: aztecVersion.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          if (data.status === "VERIFIED" && !data.jobId) {
            // Already verified — skip job tracking and notify success
            toast.success("Source code is already verified");
            onSuccess?.();
            return;
          }
          setJobId(data.jobId);
          toast.success("Verification request submitted");
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 429) {
            toast.error(
              "Too many concurrent requests. Please try again later.",
            );
          } else {
            toast.error(`Verification failed: ${error.message}`);
          }
        },
      },
    );
  };

  const handleRetry = () => {
    setJobId(null);
    mutation.reset();
  };

  // If we have a jobId, show the job status tracker
  if (jobId) {
    return (
      <div className="flex flex-col gap-4">
        <JobStatus
          classId={classId}
          version={version}
          jobId={jobId}
          onVerified={onSuccess}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold dark:text-white">
          Verify Source Code
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Submit a GitHub repository URL to verify the source code for this
          contract class. The source will be compiled and compared against the
          deployed bytecode.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="github-url"
            className="text-sm font-medium dark:text-gray-200"
          >
            GitHub Repository URL <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Github
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              id="github-url"
              type="url"
              placeholder="https://github.com/owner/repo"
              value={githubUrl}
              onChange={(e) => {
                setGithubUrl(e.target.value);
              }}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="git-ref"
              className="text-sm font-medium dark:text-gray-200"
            >
              Git Ref
            </label>
            <Input
              id="git-ref"
              type="text"
              placeholder="main"
              value={gitRef}
              onChange={(e) => {
                setGitRef(e.target.value);
              }}
            />
            <span className="text-xs text-gray-400">
              Branch, tag, or commit hash
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sub-path"
              className="text-sm font-medium dark:text-gray-200"
            >
              Sub-path
            </label>
            <Input
              id="sub-path"
              type="text"
              placeholder="contracts/token"
              value={subPath}
              onChange={(e) => {
                setSubPath(e.target.value);
              }}
            />
            <span className="text-xs text-gray-400">
              Path to contract within repo
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="aztec-version"
              className="text-sm font-medium dark:text-gray-200"
            >
              Aztec Version
            </label>
            <Input
              id="aztec-version"
              type="text"
              placeholder="4.0.3"
              value={aztecVersion}
              onChange={(e) => {
                setAztecVersion(e.target.value);
              }}
            />
            <span className="text-xs text-gray-400">
              Compiler version to use
            </span>
          </div>
        </div>

        {mutation.error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
            <AlertCircle
              size={16}
              className="text-red-600 dark:text-red-400 shrink-0"
            />
            <span className="text-sm text-red-600 dark:text-red-400">
              {mutation.error.message}
            </span>
          </div>
        )}

        <Button type="submit" disabled={mutation.isPending} className="w-fit">
          {mutation.isPending ? "Submitting..." : "Submit for Verification"}
        </Button>
      </form>
    </div>
  );
};
