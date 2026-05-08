import { useState, useEffect } from "react";
import { getPhase } from "../lib/phase";

/**
 * Returns a live-ticking countdown to the next phase boundary.
 * Updates every second. Returns null target when in the final phase.
 */
export function useCountdown() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { phase, target } = getPhase(now);

  if (!target) {
    // Event complete — no countdown
    return { phase, target: null, expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) {
    return { phase, target, expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { phase, target, expired: false, days, hours, minutes, seconds };
}
