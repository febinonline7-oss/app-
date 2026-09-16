import { useEffect, useState } from 'react';

/**
 * A clock that ticks at a fixed interval. Positions change slowly — the sky
 * rotates a quarter of a degree a minute — so the default is deliberately
 * slow to keep recomputation off the main thread's critical path.
 */
export function useNow(intervalMs = 10000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
