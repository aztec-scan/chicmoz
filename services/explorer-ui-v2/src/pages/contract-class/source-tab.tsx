import {
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useMemo, useState, type FC, type ReactNode } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { type ContractClassSourceResponse } from "~/api/contract";
import { cn } from "~/lib/utils";

type SourceFile = ContractClassSourceResponse["sourceCode"][number];

type FileTreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
};

type LintIssue = {
  filePath: string;
  line: number;
  severity: "warning" | "info";
  message: string;
};

interface Props {
  source: ContractClassSourceResponse | undefined;
  verified: boolean;
}

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  issueCounts: Map<string, number>;
  onSelectFile: (path: string) => void;
}

interface FileTreeItemProps extends Omit<FileTreeProps, "nodes"> {
  node: FileTreeNode;
  depth: number;
}

const getFileIcon = (fileName: string): ReactNode => {
  if (fileName.endsWith(".nr")) {
    return <FileCode2 size={14} className="source-tree-icon source-tree-noir" />;
  }
  return <FileText size={14} className="source-tree-icon" />;
};

const getLanguage = (filePath: string): string => {
  if (filePath.endsWith(".nr")) {
    return "rust";
  }
  if (filePath.endsWith(".toml")) {
    return "toml";
  }
  if (filePath.endsWith(".json")) {
    return "json";
  }
  if (filePath.endsWith(".md")) {
    return "markdown";
  }
  return "text";
};

const buildFileTree = (files: SourceFile[]): FileTreeNode[] => {
  const root: FileTreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");
      const existing = currentLevel.find((node) => node.name === part);

      if (existing) {
        if (existing.type === "folder" && existing.children) {
          currentLevel = existing.children;
        }
        continue;
      }

      const nextNode: FileTreeNode = isFile
        ? { name: part, path: currentPath, type: "file" }
        : { name: part, path: currentPath, type: "folder", children: [] };
      currentLevel.push(nextNode);

      if (!isFile && nextNode.children) {
        currentLevel = nextNode.children;
      }
    }
  }

  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] =>
    nodes
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
      .map((node) =>
        node.type === "folder" && node.children
          ? { ...node, children: sortNodes(node.children) }
          : node,
      );

  return sortNodes(root);
};

const lintSourceFiles = (files: SourceFile[]): LintIssue[] => {
  const issues: LintIssue[] = [];

  for (const file of files) {
    if (!file.content.trim()) {
      issues.push({
        filePath: file.path,
        line: 1,
        severity: "warning",
        message: "file is empty",
      });
      continue;
    }

    file.content.split("\n").forEach((line, index) => {
      const lineNumber = index + 1;

      if (/\s+$/.test(line)) {
        issues.push({
          filePath: file.path,
          line: lineNumber,
          severity: "info",
          message: "trailing whitespace",
        });
      }
      if (line.includes("\t")) {
        issues.push({
          filePath: file.path,
          line: lineNumber,
          severity: "info",
          message: "tab indentation",
        });
      }
      if (line.length > 120) {
        issues.push({
          filePath: file.path,
          line: lineNumber,
          severity: "warning",
          message: `long line (${line.length} chars)`,
        });
      }
      if (/\b(TODO|FIXME)\b/i.test(line)) {
        issues.push({
          filePath: file.path,
          line: lineNumber,
          severity: "info",
          message: "todo marker",
        });
      }
      if (/\bconsole\.(log|debug|warn|error)\b/.test(line)) {
        issues.push({
          filePath: file.path,
          line: lineNumber,
          severity: "warning",
          message: "console statement",
        });
      }
    });
  }

  return issues;
};

const FileTreeItem: FC<FileTreeItemProps> = ({
  node,
  depth,
  selectedPath,
  issueCounts,
  onSelectFile,
}) => {
  const [isOpen, setIsOpen] = useState(depth < 2);

  if (node.type === "folder") {
    return (
      <div>
        <button
          className="source-tree-row"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {isOpen ? <FolderOpen size={14} /> : <Folder size={14} />}
          <span className="source-tree-label">{node.name}</span>
        </button>
        {isOpen && node.children ? (
          <div>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                issueCounts={issueCounts}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const issueCount = issueCounts.get(node.path) ?? 0;

  return (
    <button
      className={cn(
        "source-tree-row",
        selectedPath === node.path && "source-tree-row-active",
      )}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
      type="button"
      onClick={() => onSelectFile(node.path)}
    >
      {getFileIcon(node.name)}
      <span className="source-tree-label">{node.name}</span>
      {issueCount ? <span className="source-tree-count">{issueCount}</span> : null}
    </button>
  );
};

const FileTree: FC<FileTreeProps> = ({
  nodes,
  selectedPath,
  issueCounts,
  onSelectFile,
}) => (
  <div className="source-tree">
    {nodes.map((node) => (
      <FileTreeItem
        key={node.path}
        node={node}
        depth={0}
        selectedPath={selectedPath}
        issueCounts={issueCounts}
        onSelectFile={onSelectFile}
      />
    ))}
  </div>
);

export const SourceTab: FC<Props> = ({ source, verified }) => {
  const sourceFiles = useMemo(() => source?.sourceCode ?? [], [source]);
  const tree = useMemo(() => buildFileTree(sourceFiles), [sourceFiles]);
  const lintIssues = useMemo(() => lintSourceFiles(sourceFiles), [sourceFiles]);
  const firstFile = sourceFiles[0]?.path ?? null;
  const [selectedPath, setSelectedPath] = useState<string | null>(firstFile);

  const selectedFile =
    sourceFiles.find((entry) => entry.path === selectedPath) ?? sourceFiles[0];
  const selectedIssues = lintIssues.filter(
    (issue) => issue.filePath === selectedFile?.path,
  );
  const warningCount = lintIssues.filter(
    (issue) => issue.severity === "warning",
  ).length;
  const issueCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const issue of lintIssues) {
      counts.set(issue.filePath, (counts.get(issue.filePath) ?? 0) + 1);
    }

    return counts;
  }, [lintIssues]);

  const handleCopy = () => {
    if (!selectedFile) {
      return;
    }
    navigator.clipboard.writeText(selectedFile.content).then(
      () => toast.success("Copied source file"),
      () => toast.error("Failed to copy source file"),
    );
  };

  return (
    <div className="source-block">
      <div className="source-meta">
        {source?.sourceCodeUrl ? (
          <div>
            <span className="k">Source</span>
            <a href={source.sourceCodeUrl} target="_blank" rel="noreferrer">
              {source.sourceCodeUrl.replace("https://", "")}
            </a>
          </div>
        ) : null}
        {source?.sourceCodeCommitHash ? (
          <div>
            <span className="k">Commit</span>
            {source.sourceCodeCommitHash.slice(0, 8)}
          </div>
        ) : null}
        {source?.aztecVersion ? (
          <div>
            <span className="k">Aztec version</span>
            {source.aztecVersion}
          </div>
        ) : null}
        {source ? (
          <div>
            <span className="k">Match</span>
            <span style={{ color: "var(--green)" }}>● bytecode verified</span>
          </div>
        ) : null}
      </div>

      {sourceFiles.length ? (
        <>
          <div className="source-lint-bar">
            <div className="source-lint-status">
              {lintIssues.length ? (
                <CircleAlert size={15} />
              ) : (
                <CircleCheck size={15} />
              )}
              <span>
                {lintIssues.length
                  ? `${lintIssues.length} basic lint note${lintIssues.length === 1 ? "" : "s"}`
                  : "basic lint checks passed"}
              </span>
            </div>
            <span>
              {sourceFiles.length} file{sourceFiles.length === 1 ? "" : "s"} ·{" "}
              {warningCount} warning{warningCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="source-browser">
            <aside className="source-sidebar">
              <FileTree
                nodes={tree}
                selectedPath={selectedFile?.path ?? null}
                issueCounts={issueCounts}
                onSelectFile={setSelectedPath}
              />
            </aside>

            <section className="source-viewer">
              <div className="source-viewer-head">
                <span>{selectedFile?.path ?? "select a file"}</span>
                <button type="button" onClick={handleCopy}>
                  <Copy size={13} /> copy
                </button>
              </div>
              {selectedFile ? (
                <SyntaxHighlighter
                  language={getLanguage(selectedFile.path)}
                  style={oneDark}
                  showLineNumbers
                  wrapLines={false}
                  customStyle={{
                    margin: 0,
                    minHeight: "100%",
                    width: "max-content",
                    minWidth: "100%",
                    borderRadius: 0,
                    background: "#282c34",
                    fontSize: "11px",
                    lineHeight: "1.65",
                  }}
                  codeTagProps={{ style: { background: "transparent" } }}
                  lineNumberStyle={{
                    minWidth: "3em",
                    paddingRight: "1em",
                    color: "#636d83",
                    userSelect: "none",
                  }}
                >
                  {selectedFile.content}
                </SyntaxHighlighter>
              ) : null}
            </section>
          </div>

          <div className="source-lint-list">
            <span className="k">Selected file lint</span>
            {selectedIssues.length ? (
              selectedIssues.slice(0, 8).map((issue) => (
                <span key={`${issue.filePath}-${issue.line}-${issue.message}`}>
                  line {issue.line}: {issue.message}
                </span>
              ))
            ) : (
              <span>no basic lint notes for this file</span>
            )}
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ background: "var(--bg-1)" }}>
          {verified
            ? "source not yet fetched"
            : "contract class is unverified — submit source to verify"}
        </div>
      )}
    </div>
  );
};
