import { useQueryClient } from "@tanstack/react-query";
import { useCallback, type FC } from "react";
import { Loader } from "~/components/loader";
import { SourceCodeViewer } from "~/components/source-code-viewer";
import { VerifySourceForm } from "~/components/verify-source-form";
import { useContractClassSource } from "~/hooks";
import { queryKeyGenerator } from "~/hooks/api/utils";

type SourceCodeTabProps = {
  classId: string;
  version: string;
  hasSourceCode: boolean;
};

export const SourceCodeTab: FC<SourceCodeTabProps> = ({
  classId,
  version,
  hasSourceCode,
}) => {
  const queryClient = useQueryClient();

  const {
    data: sourceData,
    isLoading,
    error,
  } = useContractClassSource(classId, version, hasSourceCode);

  const handleVerificationSuccess = useCallback(() => {
    // Invalidate source code query to refetch
    void queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.contractClassSource(classId, version),
    });
    // Also invalidate the contract class query to update sourceCodeUrl
    void queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.contractClass({ classId, version }),
    });
  }, [queryClient, classId, version]);

  // If source code is verified, show the viewer
  if (hasSourceCode) {
    if (isLoading) {
      return <Loader amount={3} />;
    }

    if (error) {
      return (
        <div className="text-sm text-red-500 dark:text-red-400">
          Failed to load source code: {error.message}
        </div>
      );
    }

    if (sourceData && sourceData.sourceCode.length > 0) {
      return (
        <SourceCodeViewer
          sourceFiles={sourceData.sourceCode}
          sourceCodeUrl={sourceData.sourceCodeUrl}
        />
      );
    }

    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Source code data is not available.
      </div>
    );
  }

  // Not verified — show the verification form
  return (
    <VerifySourceForm
      classId={classId}
      version={version}
      onSuccess={handleVerificationSuccess}
    />
  );
};
