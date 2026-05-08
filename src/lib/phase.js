import { REGISTRATION_DEADLINE, EVENT_START, EVENT_END } from "./constants";

/**
 * Determines the current tournament phase based on `now`.
 *
 * Phase 1: pre_registration   — registration open, counting down to deadline
 * Phase 2: pre_event          — registration closed, counting down to event start
 * Phase 3: live               — event in progress, celebratory banner
 * Phase 4: complete           — event over, thank-you message
 */
export function getPhase(now = new Date()) {
  if (now < REGISTRATION_DEADLINE) {
    return { phase: "pre_registration", target: REGISTRATION_DEADLINE };
  }
  if (now < EVENT_START) {
    return { phase: "pre_event", target: EVENT_START };
  }
  if (now < EVENT_END) {
    return { phase: "live", target: EVENT_END };
  }
  return { phase: "complete", target: null };
}

// Convenience helpers
export function isRegistrationOpen(phase) {
  return phase === "pre_registration";
}

export function isEventLive(phase) {
  return phase === "live";
}

export function isEventComplete(phase) {
  return phase === "complete";
}
