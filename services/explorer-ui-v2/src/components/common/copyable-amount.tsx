import { type FC, useCallback, useEffect, useRef, useState } from "react";

interface Props {
  displayAmount: string;
  rawAmount: string | number | bigint | null | undefined;
  className?: string;
}

export const CopyableAmount: FC<Props> = ({
  displayAmount,
  rawAmount,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    if (rawAmount === null || rawAmount === undefined) {
      return;
    }
    const value = String(rawAmount);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked. The displayed amount remains selectable in the UI.
    }
  }, [rawAmount]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (rawAmount === null || rawAmount === undefined) {
    return <span className={className}>—</span>;
  }

  return (
    <button
      type="button"
      className={`copyable copyable-amount${copied ? " copied" : ""}${className ? ` ${className}` : ""}`}
      onClick={() => {
        void handleCopy();
      }}
      title={copied ? "Copied" : "Copy full amount"}
      aria-label={copied ? "Copied to clipboard" : "Copy full amount"}
    >
      <span className="copyable-text">{displayAmount}</span>
      <span className="copyable-icon" aria-hidden>
        {copied ? "✓" : "⎘"}
      </span>
    </button>
  );
};
