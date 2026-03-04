export type TreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
};

export type FileTreeProps = {
  nodes: TreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  depth?: number;
};

export type CodeDisplayProps = {
  filePath: string;
  content: string;
};

export type SourceCodeViewerProps = {
  sourceFiles: { path: string; content: string }[];
  sourceCodeUrl?: string | null;
};
