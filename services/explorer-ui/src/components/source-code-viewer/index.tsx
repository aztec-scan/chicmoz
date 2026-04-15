import { ExternalLink } from "lucide-react";
import { useMemo, useState, type FC } from "react";
import { CodeDisplay } from "./code-display";
import { buildFileTree, FileTree } from "./file-tree";
import { type SourceCodeViewerProps } from "./types";

export const SourceCodeViewer: FC<SourceCodeViewerProps> = ({
  sourceFiles,
  sourceCodeUrl,
}) => {
  const tree = useMemo(() => buildFileTree(sourceFiles), [sourceFiles]);

  const firstFile = sourceFiles.length > 0 ? sourceFiles[0].path : null;
  const [selectedPath, setSelectedPath] = useState<string | null>(firstFile);

  const selectedFile = sourceFiles.find((f) => f.path === selectedPath);

  return (
    <div className="flex flex-col gap-3">
      {sourceCodeUrl && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Verified
          </span>
          <a
            href={sourceCodeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View on GitHub
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      <div className="flex flex-col md:flex-row border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden min-h-[400px]">
        {/* File tree sidebar */}
        <div className="md:w-64 md:min-w-[16rem] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 overflow-auto max-h-[200px] md:max-h-[600px]">
          <div className="p-2">
            <FileTree
              nodes={tree}
              selectedPath={selectedPath}
              onSelectFile={setSelectedPath}
            />
          </div>
        </div>

        {/* Code display */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {selectedFile ? (
            <CodeDisplay
              filePath={selectedFile.path}
              content={selectedFile.content}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
