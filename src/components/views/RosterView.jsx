import { X, Phone } from "lucide-react";
import { C } from "../../lib/constants";
import { splitChurch, teamHeadcount } from "../../lib/helpers";
import { LoadingState, EmptyState } from "../shared/Status";

export function RosterView({ registrations, loading, isAdmin, onRemove }) {
  if (loading) return <LoadingState />;
  const teams = registrations.filter((r) => r.kind === "team");
  if (teams.length === 0) return <EmptyState message="No teams registered yet. Be the first." />;

  const mens = teams.filter((t) => t.division === "mens");
  const womens = teams.filter((t) => t.division === "womens");

  return (
    <div className="space-y-10 sm:space-y-12">
      <DivisionBlock title="Men's Division" teams={mens} isAdmin={isAdmin} onRemove={onRemove} />
      <DivisionBlock title="Women's Division" teams={womens} isAdmin={isAdmin} onRemove={onRemove} />
    </div>
  );
}

function DivisionBlock({ title, teams, isAdmin, onRemove }) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b-2 pb-2 mb-5 sm:mb-6" style={{ borderColor: C.ink }}>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(28px, 7vw, 44px)",
          lineHeight: 1, color: C.ink, letterSpacing: "0.02em",
        }}>
          {title}
        </h2>
        <span className="text-xs sm:text-sm uppercase tracking-widest" style={{ color: C.inkSoft }}>
          {teams.length} {teams.length === 1 ? "team" : "teams"}
        </span>
      </div>

      {teams.length === 0 ? (
        <p className="italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          No teams in this division yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {teams.map((t) => <TeamCard key={t.id} team={t} isAdmin={isAdmin} onRemove={onRemove} />)}
        </div>
      )}
    </section>
  );
}

function TeamCard({ team, isAdmin, onRemove }) {
  const { name: churchShort, location: churchLoc } = splitChurch(team.church);
  const headcount = teamHeadcount(team);
  return (
    <article className="border p-4 sm:p-5 relative" style={{ borderColor: C.ink, background: C.paper }}>
      {isAdmin && (
        <button onClick={() => onRemove(team.id)}
          className="absolute top-2 right-2 p-1.5"
          style={{ color: C.rust }} title="Remove (Admin)">
          <X size={16} />
        </button>
      )}

      <div className="text-[10px] uppercase tracking-[0.25em] mb-1 pr-6"
        style={{ color: C.rust, fontWeight: 700 }}>
        {churchLoc || "—"}
      </div>
      <h3 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(22px, 6vw, 28px)", lineHeight: 1, color: C.ink,
      }}>
        {churchShort}
      </h3>
      <div className="text-xs italic mt-1 mb-3" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
        Captain: {team.captain_name} · {headcount} {headcount === 1 ? "player" : "players"}
      </div>

      {isAdmin && (
        <div className="mb-4 px-3 py-2 text-[11px] flex flex-wrap gap-x-4 gap-y-1"
          style={{ background: C.cream, border: `1px dashed ${C.ink}`, color: C.inkSoft }}>
          <span><strong style={{ color: C.ink }}>Code:</strong> <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "0.1em", color: C.ink }}>{team.edit_code || "—"}</span></span>
          <span className="inline-flex items-center gap-1">
            <Phone size={11} />
            <a href={`tel:${(team.phone || "").replace(/\D/g, "")}`}
              className="underline" style={{ color: C.ink }}>
              {team.phone || "—"}
            </a>
          </span>
        </div>
      )}

      <ol className="space-y-1.5">
        <li className="flex items-center gap-3 text-sm" style={{ color: C.ink }}>
          <span className="w-6 text-center text-xs"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: C.rust }}>
            01
          </span>
          <span className="flex-1 border-b border-dotted pb-0.5 flex items-center gap-2"
            style={{ borderColor: C.line }}>
            <span className="font-semibold">{team.captain_name}</span>
            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5"
              style={{ background: C.ink, color: C.cream, letterSpacing: "0.15em" }}>
              Cap
            </span>
          </span>
        </li>
        {(team.players || []).map((p, i) => (
          <li key={i} className="flex items-center gap-3 text-sm" style={{ color: C.ink }}>
            <span className="w-6 text-center text-xs"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: C.rust }}>
              {String(i + 2).padStart(2, "0")}
            </span>
            <span className="flex-1 border-b border-dotted pb-0.5" style={{ borderColor: C.line }}>
              {p}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}
