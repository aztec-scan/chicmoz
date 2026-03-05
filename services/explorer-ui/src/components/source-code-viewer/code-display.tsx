import { CopyIcon } from "@radix-ui/react-icons";
import { type FC } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { type CodeDisplayProps } from "./types";

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

export const CodeDisplay: FC<CodeDisplayProps> = ({ filePath, content }) => {
  const language = getLanguage(filePath);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(
      () => {
        toast.success("Copied to clipboard");
      },
      () => {
        toast.error("Failed to copy to clipboard");
      },
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
        <span className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate">
          {filePath}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
      <div className="overflow-auto flex-1 bg-[#282c34]">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: "0.8125rem",
            lineHeight: "1.5",
            background: "#282c34",
          }}
          codeTagProps={{
            style: { background: "transparent" },
          }}
          lineNumberStyle={{
            minWidth: "3em",
            paddingRight: "1em",
            color: "#636d83",
            userSelect: "none",
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
