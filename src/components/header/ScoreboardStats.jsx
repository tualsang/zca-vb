import { C } from "../../lib/constants";

export function ScoreboardStats({ stats, loading, className = "" }) {
  return (
    <div className={`flex gap-0 border ${className}`} style={{ borderColor: C.ink, background: C.paper }}>
      <Stat label="Players" value={loading ? "…" : stats.players} />
      <Stat label="Teams" value={loading ? "…" : stats.teams} divider />
      <Stat label="Free Agents" value={loading ? "…" : stats.freeAgents} divider />
    </div>
  );
}

function Stat({ label, value, divider }) {
  return (
    <div className="flex-1 text-center px-4 sm:px-5 py-2 sm:py-3 min-w-[72px] sm:min-w-[100px]"
      style={{ borderLeft: divider ? `1px solid ${C.ink}` : "none" }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(28px, 7vw, 40px)", lineHeight: 1, color: C.ink,
      }}>
        {value}
      </div>
      <div className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-widest" style={{ color: C.inkSoft }}>
        {label}
      </div>
    </div>
  );
}
