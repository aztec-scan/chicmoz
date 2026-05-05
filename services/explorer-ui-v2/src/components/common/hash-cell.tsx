import {
  type FC,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface Props {
  value: string;
  /**
   * Number of trailing characters that must always remain visible. The
   * leading portion shrinks as the column narrows; keeping a fixed tail
   * is critical for hash verification (people compare the last few chars
   * to confirm a value).
   */
  tailLen?: number;
  className?: string;
  title?: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Cached monospace character width per computed font. Calculated lazily on
 * first measurement of a HashCell that shares the same font, then reused
 * across every other cell — so the page-load cost is one synchronous
 * measurement regardless of how many hashes are on screen.
 */
const charWidthCache = new Map<string, number>();
const measureCharWidth = (font: string): number => {
  const cached = charWidthCache.get(font);
  if (cached !== undefined) {return cached;}
  const probe = document.createElement("span");
  probe.style.font = font;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.whiteSpace = "pre";
  // 64-char hex sample — average over many chars to ride out kerning.
  probe.textContent = "0123456789abcdef".repeat(4);
  document.body.appendChild(probe);
  const w = probe.getBoundingClientRect().width / probe.textContent.length;
  document.body.removeChild(probe);
  charWidthCache.set(font, w);
  return w;
};

/**
 * Hash display that adapts to its container width with pixel-tight
 * truncation: `0x1234…5678abcd`. Measures container width via a
 * ResizeObserver and slices the value to the exact char count that fits,
 * so there's never a sub-character gap between the head and tail.
 *
 * On wide columns the entire hash renders seamlessly. On narrow columns
 * the leading portion shortens; the last `tailLen` chars are always
 * preserved.
 */
export const HashCell: FC<Props> = ({
  value,
  tailLen = 8,
  className,
  title,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  // Initial guess: render the full string. The layout effect resizes it
  // to fit on first paint before the user can see any reflow.
  const [headLen, setHeadLen] = useState(value.length - tailLen);
  const [showFull, setShowFull] = useState(true);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node || !value) {return;}

    const recompute = () => {
      const font = window.getComputedStyle(node).font;
      const charWidth = measureCharWidth(font);
      if (!Number.isFinite(charWidth) || charWidth <= 0) {return;}

      const containerWidth = node.clientWidth;
      const totalCharsFit = Math.floor(containerWidth / charWidth);

      if (totalCharsFit >= value.length) {
        setShowFull(true);
        return;
      }
      // Reserve 1 char for the ellipsis between head and tail.
      const newHeadLen = Math.max(0, totalCharsFit - tailLen - 1);
      setShowFull(false);
      setHeadLen(newHeadLen);
    };

    recompute();
    const obs = new ResizeObserver(recompute);
    obs.observe(node);
    return () => obs.disconnect();
  }, [value, tailLen]);

  const cls = className ? `hash ${className}` : "hash";

  if (!value) {
    return <span ref={ref} className={cls} title={title ?? value} />;
  }

  if (showFull || value.length <= tailLen + 4) {
    return (
      <span ref={ref} className={cls} title={title ?? value}>
        {value}
      </span>
    );
  }

  return (
    <span ref={ref} className={cls} title={title ?? value}>
      {value.slice(0, headLen) + "…" + value.slice(-tailLen)}
    </span>
  );
};
