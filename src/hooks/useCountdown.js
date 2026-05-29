import { useState, useEffect, useMemo } from "react";
import { getPhase } from "../lib/phase";

/**
 * Returns a live-ticking countdown to the next phase boundary, plus the `now`
 * it is using (so callers can gate things on specific times, like MVP voting
 * opening at noon). Updates every second.
 *
 * Dev/testing: append ?t=<ISO date> to the URL to freeze the clock at that
 * instant and preview a phase. Include the EDT offset, e.g.
 *   ?t=2026-06-15T00:00:00-04:00  -> pre_event
 *   ?t=2026-07-10T12:00:00-04:00  -> live (and MVP voting open)
 *   ?t=2026-07-11T00:00:00-04:00  -> complete
 * With no param it uses the real clock, so this is inert in production.
 */
function getOverrideNow() {
  if (typeof window === "undefined") return null;
  const t = new URLSearchParams(window.location.search).get("t");
  if (!t) return null;
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
}

export function useCountdown() {
  const override = useMemo(getOverrideNow, []);
  const [now, setNow] = useState(() => override ?? new Date());

  useEffect(() => {
    if (override) return;               // frozen at the override — don't tick
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [override]);

  const { phase, target } = getPhase(now);

  if (!target) {
    return { phase, target: null, now, expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) {
    return { phase, target, now, expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { phase, target, now, expired: false, days, hours, minutes, seconds };
}