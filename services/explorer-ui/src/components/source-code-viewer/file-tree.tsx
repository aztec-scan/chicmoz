import {
  ChevronDown,
  ChevronRight,
  FileCode,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useState, type FC } from "react";
import { cn } from "~/lib/utils";
import { type FileTreeProps, type TreeNode } from "./types";

const getFileIcon = (name: string) => {
  if (name.endsWith(".nr")) {
    return <FileCode size={14} className="shrink-0 text-purple-500" />;
  }
  return (
    <FileText size={14} className="shrink-0 text-gray-500 dark:text-gray-400" />
  );
};

const TreeNodeItem: FC<{
  node: TreeNode;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  depth: number;
}> = ({ node, selectedPath, onSelectFile, depth }) => {
  const [isOpen, setIsOpen] = useState(depth < 2);

  if (node.type === "folder") {
    return (
      <div>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? (
            <ChevronDown size={14} className="shrink-0 text-gray-500" />
          ) : (
            <ChevronRight size={14} className="shrink-0 text-gray-500" />
          )}
          {isOpen ? (
            <FolderOpen
              size={14}
              className="shrink-0 text-yellow-600 dark:text-yellow-500"
            />
          ) : (
            <Folder
              size={14}
              className="shrink-0 text-yellow-600 dark:text-yellow-500"
            />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedPath === node.path;

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm",
        isSelected
          ? "bg-primary/10 text-primary font-medium dark:bg-primary/20"
          : "hover:bg-gray-100 dark:hover:bg-gray-800",
      )}
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
      onClick={() => {
        onSelectFile(node.path);
      }}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
};

export const buildFileTree = (
  files: { path: string; content: string }[],
): TreeNode[] => {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      const existing = currentLevel.find((n) => n.name === part);

      if (existing) {
        if (existing.type === "folder" && existing.children) {
          currentLevel = existing.children;
        }
      } else {
        const newNode: TreeNode = isFile
          ? { name: part, path: currentPath, type: "file" }
          : { name: part, path: currentPath, type: "folder", children: [] };
        currentLevel.push(newNode);
        if (!isFile && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    }
  }

  // Sort: folders first, then files, alphabetically within each group
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
      .map((node) => {
        if (node.type === "folder" && node.children) {
          return { ...node, children: sortNodes(node.children) };
        }
        return node;
      });
  };

  return sortNodes(root);
};

export const FileTree: FC<FileTreeProps> = ({
  nodes,
  selectedPath,
  onSelectFile,
  depth = 0,
}) => {
  return (
    <div className="flex flex-col">
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          depth={depth}
        />
      ))}
    </div>
  );
};
