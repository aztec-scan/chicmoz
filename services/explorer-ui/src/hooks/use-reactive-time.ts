import { useState, useEffect } from 'react';

export const useReactiveTime = (intervalMs: number = 1000) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
};
