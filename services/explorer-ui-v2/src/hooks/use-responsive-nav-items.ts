import { useMemo, useSyncExternalStore } from "react";

export interface ResponsiveBreakpoint {
  /** Inclusive upper bound on viewport width that triggers `visible`. */
  maxWidth: number;
  /** Items to keep visible at this size; the rest move to overflow. */
  visible: number;
}

const subscribeToResize = (cb: () => void): (() => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};

const getVisibleCount = (
  total: number,
  breakpoints: ResponsiveBreakpoint[],
): number => {
  if (typeof window === "undefined") {return total;}
  const w = window.innerWidth;
  for (const bp of breakpoints) {
    if (w <= bp.maxWidth) {return bp.visible;}
  }
  return total;
};

interface UseResponsiveNavItems<T> {
  primaryVisible: T[];
  primaryOverflow: T[];
}

/**
 * Splits a list of items into visible/overflow segments based on viewport
 * width. Use for nav strips that collapse right-to-left into a More menu as
 * the viewport shrinks. Sampled via `useSyncExternalStore` on `resize`.
 */
export const useResponsiveNavItems = <T>(
  items: T[],
  breakpoints: ResponsiveBreakpoint[],
): UseResponsiveNavItems<T> => {
  const visibleCount = useSyncExternalStore(
    subscribeToResize,
    () => getVisibleCount(items.length, breakpoints),
    () => items.length,
  );

  return useMemo(
    () => ({
      primaryVisible: items.slice(0, visibleCount),
      primaryOverflow: items.slice(visibleCount),
    }),
    [items, visibleCount],
  );
};
