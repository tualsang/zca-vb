// Split "Church Name - Location" or "Church Name — Location" on either dash
export function splitChurch(full) {
  if (!full) return { name: "—", location: "" };
  const parts = full.split(/\s+[—-]\s+/);
  return {
    name: parts[0]?.trim() || full,
    location: parts.slice(1).join(" - ").trim(),
  };
}

// Generate a unique edit code like "FAIT-X7K2"
export function generateEditCode(churchName) {
  const prefix = (splitChurch(churchName).name || "TEAM")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
}

// Strip everything except digits, cap at 10
export function sanitizePhoneInput(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}

// Format 10 (or partial) digits as (XXX) XXX-XXXX
export function formatPhone(digits) {
  if (!digits) return "";
  const d = digits.replace(/\D/g, "");
  if (d.length <= 3) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

// Strip digits from name input
export function sanitizeNameInput(value) {
  return value.replace(/[0-9]/g, "");
}

// Total players for a team includes the captain
export function teamHeadcount(team) {
  return (team.players?.length || 0) + 1;
}
