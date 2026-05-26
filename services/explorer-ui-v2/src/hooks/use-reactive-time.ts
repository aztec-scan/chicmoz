import { useEffect, useState } from "react";

/** Re-renders on an interval so components can display rolling ages/countdowns. */
export const useReactiveTime = (intervalMs = 1_000): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};
