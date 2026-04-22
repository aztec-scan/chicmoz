import { type FC, useCallback, useRef, useState } from "react";

interface Props {
  /** The full value copied to clipboard when clicked. */
  value: string | null | undefined;
  /** Optional display text — if omitted the raw `value` is shown. */
  display?: string;
  /** Shown as a tooltip before copy, replaced by "Copied" briefly after. */
  title?: string;
  className?: string;
}

/**
 * Click-to-copy pill for on-chain addresses / hashes. Falls back to document.execCommand
 * for older browsers without the async Clipboard API.
 */
export const CopyableAddress: FC<Props> = ({
  value,
  display,
  title = "Copy address",
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    if (!value) {return;}
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
      if (timeoutRef.current) {clearTimeout(timeoutRef.current);}
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — ignore silently; the user can still select manually.
    }
  }, [value]);

  if (!value) {return <span className={className}>—</span>;}

  return (
    <button
      type="button"
      className={`copyable${copied ? " copied" : ""}${className ? ` ${className}` : ""}`}
      onClick={handleCopy}
      title={copied ? "Copied" : title}
      aria-label={copied ? "Copied to clipboard" : title}
    >
      <span className="copyable-text">{display ?? value}</span>
      <span className="copyable-icon" aria-hidden>
        {copied ? "✓" : "⎘"}
      </span>
    </button>
  );
};
