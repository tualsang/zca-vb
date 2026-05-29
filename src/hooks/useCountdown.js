import { useState, useEffect, useMemo } from "react";
import { getPhase } from "../lib/phase";

/**
 * Returns a live-ticking countdown to the next phase boundary.
 * Updates every second. Returns null target when in the final phase.
 *
 * Dev/testing: append ?t=<ISO date> to the URL to freeze the clock at that
 * instant and preview a phase. Include the EDT offset, e.g.
 *   ?t=2026-06-15T00:00:00-04:00  → pre_event
 *   ?t=2026-07-10T12:00:00-04:00  → live
 *   ?t=2026-07-11T00:00:00-04:00  → complete
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