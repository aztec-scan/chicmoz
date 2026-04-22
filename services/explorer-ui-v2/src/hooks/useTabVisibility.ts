import { useEffect, useState } from "react";

/** `true` while the tab is visible, `false` when hidden. */
export const useTabVisibility = (): boolean => {
  const [isActive, setIsActive] = useState<boolean>(
    typeof document === "undefined" ? true : !document.hidden,
  );

  useEffect(() => {
    const handleVisibilityChange = () => setIsActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return isActive;
};
