// ─────────────────────────────────────────────────────────────────────────
// EDIT YOUR CHURCH LIST HERE — these appear in the dropdown
// ─────────────────────────────────────────────────────────────────────────
export const CHURCHES = [
  "Faith Assembly Church - Arizona",
  "Bethel Mission Church - Atlanta, GA",
  "Zomi Agape Church - Bowling Green, Kentucky",
  "Zomi Community Christian Church - Washington D.C.",
  "Zomi Mission Church - Maryland",
  "Shalom Zomi Baptist Church - Charlotte, NC",
  "Charlotte Emanuel Church - Charlotte, NC",
  "Zomi Christian Church - Columbus, OH",
  "Zomi Christian Church - Nashville, TN",
  "Full Life - Tulsa, OK",
  "Free Agents",
];

// ─── Key dates ────────────────────────────────────────────────────────────
// All times in Eastern Daylight Time (EDT = UTC-4) for June/July
//
// June 14, 2026, 11:59 PM EDT  →  03:59 UTC on June 15
// July 10, 2026, 9:00 AM EDT   →  13:00 UTC on July 10
// July 10, 2026, 12:00 PM EDT  →  16:00 UTC on July 10
// July 10, 2026, 5:00 PM EDT   →  21:00 UTC on July 10
export const REGISTRATION_DEADLINE = new Date("2026-06-15T03:59:00Z");
export const EVENT_START = new Date("2026-07-10T13:00:00Z");
export const EVENT_END = new Date("2026-07-10T21:00:00Z");

// MVP voting opens at noon on tournament day and stays open from then on.
export const MVP_VOTE_OPEN = new Date("2026-07-10T13:01:00Z");

// Event metadata
export const EVENT_DATE_DISPLAY = "July 10, 2026";
export const EVENT_TIME_DISPLAY = "9:00 AM – 5:00 PM EDT";
export const EVENT_ADDRESS = "8500 Ridgelys Run Rd, Jessup, MD 20794";

// ─── Color tokens ─────────────────────────────────────────────────────────
export const C = {
  cream: "#F1EADA",
  paper: "#F8F2E2",
  ink: "#0E1A33",
  inkSoft: "#1F2D4F",
  rust: "#C84E2E",
  rustDark: "#A53D21",
  olive: "#5C6B3A",
  line: "#D9CFB8",
  warn: "#B8860B",
  warnBg: "#FBF3DB",
  ok: "#2D5A3D",
  okBg: "#DDF1DE",
  // Live/celebration accents
  live: "#1A7F4F",       // green for "live" state
  liveBg: "#DDF1DE",
  gold: "#B8860B",
  goldBg: "#FBF3DB",
  bronze: "#8B5A2B",
  bronzeBg: "#ECDCC4",
};