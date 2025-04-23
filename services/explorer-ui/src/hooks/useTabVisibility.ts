import { useEffect, useState } from "react";

export const useTabVisibility = (): boolean => {
  const [isTabActive, setIsTabActive] = useState<boolean>(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const active = !document.hidden;
      setIsTabActive(active);
      console.log(`Tab is now ${active ? "active" : "inactive"}`);
    };

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isTabActive;
};
