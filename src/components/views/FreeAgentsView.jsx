import { X, Phone } from "lucide-react";
import { C } from "../../lib/constants";
import { splitChurch } from "../../lib/helpers";
import { LoadingState, EmptyState } from "../shared/Status";

export function FreeAgentsView({ registrations, loading, isAdmin, onRemove }) {
  if (loading) return <LoadingState />;
  const agents = registrations.filter((r) => r.kind === "free_agent");
  if (agents.length === 0) return <EmptyState message="No free agents yet." />;

  const mens = agents.filter((a) => a.division === "mens");
  const womens = agents.filter((a) => a.division === "womens");

  return (
    <div className="space-y-10 sm:space-y-12">
      <FreeAgentDivision title="Men's Free Agents" agents={mens} isAdmin={isAdmin} onRemove={onRemove} />
      <FreeAgentDivision title="Women's Free Agents" agents={womens} isAdmin={isAdmin} onRemove={onRemove} />
    </div>
  );
}

function FreeAgentDivision({ title, agents, isAdmin, onRemove }) {
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
          {agents.length} {agents.length === 1 ? "player" : "players"}
        </span>
      </div>

      {agents.length === 0 ? (
        <p className="italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          No free agents in this division yet.
        </p>
      ) : (
        <ol className="border" style={{ borderColor: C.ink, background: C.paper }}>
          {agents.map((a, i) => {
            const { name: churchShort, location: churchLoc } = splitChurch(a.church);
            return (
              <li key={a.id}
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4"
                style={{ borderBottom: i < agents.length - 1 ? `1px solid ${C.line}` : "none" }}>
                <span className="w-8 sm:w-10 text-center flex-shrink-0"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(18px, 5vw, 24px)",
                    color: C.rust, lineHeight: 1,
                  }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm sm:text-base truncate" style={{ color: C.ink }}>
                    {a.player_name}
                  </div>
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-widest mt-0.5 truncate"
                    style={{ color: C.inkSoft }}>
                    {churchShort}{churchLoc ? ` · ${churchLoc}` : ""}
                  </div>
                  {isAdmin && (
                    <div className="text-[11px] mt-0.5 inline-flex items-center gap-1" style={{ color: C.inkSoft }}>
                      <Phone size={10} />
                      <a href={`tel:${(a.phone || "").replace(/\D/g, "")}`}
                        className="underline" style={{ color: C.ink }}>
                        {a.phone || "—"}
                      </a>
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => onRemove(a.id)}
                    className="p-2 flex-shrink-0"
                    style={{ color: C.rust }} aria-label="Remove (Admin)">
                    <X size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
