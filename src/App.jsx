import { useState, useEffect, useMemo } from "react";
import {
  Trophy, Users, UserPlus, X, Plus, Check, ChevronRight,
  Loader2, Shield, Flag,
} from "lucide-react";
import { supabase } from "./lib/supabase";

// ─────────────────────────────────────────────────────────────────────────
// EDIT YOUR CHURCH LIST HERE — these appear in the dropdown
// ─────────────────────────────────────────────────────────────────────────
const CHURCHES = [
  "Grace Fellowship — Phoenix, AZ",
  "Cornerstone Bible Church — Nashville, TN",
  "Living Hope Church — Dallas, TX",
  "New Life Assembly — Atlanta, GA",
  "Faith Community Church — Charlotte, NC",
  "Calvary Chapel — Denver, CO",
  "Redeemer Church — Portland, OR",
  "First Baptist — Birmingham, AL",
  "Hillside Church — San Diego, CA",
  "Christ the King — Indianapolis, IN",
];

const FREE_AGENT_TEAM_SIZE = 6;

const C = {
  cream: "#F1EADA",
  paper: "#F8F2E2",
  ink: "#0E1A33",
  inkSoft: "#1F2D4F",
  rust: "#C84E2E",
  rustDark: "#A53D21",
  olive: "#5C6B3A",
  line: "#D9CFB8",
};

export default function App() {
  const [tab, setTab] = useState("register");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState(null);

  useEffect(() => {
    loadRegistrations();

    const channel = supabase
      .channel("registrations-changes")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "registrations" },
        () => loadRegistrations()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadRegistrations = async () => {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Load error:", error);
    } else {
      setRegistrations(data || []);
    }
    setLoading(false);
  };

  const addRegistration = async (entry) => {
    const { data, error } = await supabase
      .from("registrations")
      .insert([entry])
      .select()
      .single();

    if (error) {
      alert("Something went wrong saving your registration. Please try again.\n\n" + error.message);
      return;
    }
    setJustSubmitted(data);
    setTab("confirm");
  };

  const removeRegistration = async (id) => {
    if (!confirm("Remove this registration?")) return;
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) alert("Could not remove (admin may have disabled deletes): " + error.message);
  };

  const stats = useMemo(() => {
    let players = 0, teams = 0, freeAgents = 0;
    registrations.forEach((r) => {
      if (r.kind === "team") {
        teams++;
        players += (r.players?.length || 0);
      } else {
        freeAgents++;
        players++;
      }
    });
    return { players, teams, freeAgents };
  }, [registrations]);

  return (
    <div style={{ background: C.cream, color: C.ink, minHeight: "100vh" }}>
      <header className="border-b" style={{ borderColor: C.ink }}>
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1" style={{ color: C.rust }}>
                <Trophy size={14} strokeWidth={2.5} />
                <span className="text-xs tracking-[0.25em] uppercase font-semibold">
                  Conference 2026
                </span>
              </div>
              <h1 className="leading-none tracking-tight" style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(48px, 8vw, 88px)",
                color: C.ink, letterSpacing: "0.01em",
              }}>
                Volleyball <span style={{ color: C.rust }}>Tournament</span>
              </h1>
              <p className="mt-2 italic max-w-xl" style={{
                fontFamily: "'Newsreader', serif", color: C.inkSoft, fontSize: 17,
              }}>
                Ten churches. Two divisions. One weekend. — Register your roster below or sign up
                solo as a free agent and we'll build a team around you.
              </p>
            </div>
            <ScoreboardStats stats={stats} loading={loading} />
          </div>

          <nav className="mt-8 flex gap-1 flex-wrap">
            <TabButton active={tab === "register"} onClick={() => setTab("register")}>
              <UserPlus size={14} /> Register
            </TabButton>
            <TabButton active={tab === "roster"} onClick={() => setTab("roster")}>
              <Users size={14} /> Roster ({stats.players})
            </TabButton>
            <TabButton active={tab === "freeagents"} onClick={() => setTab("freeagents")}>
              <Flag size={14} /> Free Agents ({stats.freeAgents})
            </TabButton>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {tab === "register" && <RegisterForm onSubmit={addRegistration} />}
        {tab === "confirm" && (
          <ConfirmScreen
            entry={justSubmitted}
            onRegisterAnother={() => { setJustSubmitted(null); setTab("register"); }}
            onViewRoster={() => setTab("roster")}
          />
        )}
        {tab === "roster" && (
          <RosterView registrations={registrations} loading={loading} onRemove={removeRegistration} />
        )}
        {tab === "freeagents" && (
          <FreeAgentsView registrations={registrations} loading={loading} onRemove={removeRegistration} />
        )}
      </main>

      <footer className="border-t mt-12 py-6 text-center text-xs uppercase tracking-widest"
        style={{ borderColor: C.line, color: C.inkSoft }}>
        Live roster · Updated in real-time
      </footer>
    </div>
  );
}

function ScoreboardStats({ stats, loading }) {
  return (
    <div className="flex gap-0 border" style={{ borderColor: C.ink, background: C.paper }}>
      <Stat label="Players" value={loading ? "…" : stats.players} />
      <Stat label="Teams" value={loading ? "…" : stats.teams} divider />
      <Stat label="Free Agents" value={loading ? "…" : stats.freeAgents} divider />
    </div>
  );
}

function Stat({ label, value, divider }) {
  return (
    <div className="px-5 py-3 text-center min-w-[88px]"
      style={{ borderLeft: divider ? `1px solid ${C.ink}` : "none" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, lineHeight: 1, color: C.ink }}>
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: C.inkSoft }}>
        {label}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className="px-4 py-2 text-sm uppercase tracking-wider flex items-center gap-2 transition-all border"
      style={{
        background: active ? C.ink : "transparent",
        color: active ? C.cream : C.ink,
        borderColor: C.ink, fontWeight: 600, letterSpacing: "0.1em",
      }}>
      {children}
    </button>
  );
}

function RegisterForm({ onSubmit }) {
  const [kind, setKind] = useState("");
  const [church, setChurch] = useState("");
  const [division, setDivision] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [players, setPlayers] = useState([""]);
  const [agentName, setAgentName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addPlayerRow = () => setPlayers([...players, ""]);
  const updatePlayer = (i, v) => {
    const next = [...players]; next[i] = v; setPlayers(next);
  };
  const removePlayer = (i) => setPlayers(players.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setError("");
    if (!kind) return setError("Choose how you're registering.");
    if (!church) return setError("Select your church.");
    if (!division) return setError("Pick a division.");

    setSubmitting(true);
    try {
      if (kind === "team") {
        if (!captainName.trim()) { setError("Enter the captain's name."); setSubmitting(false); return; }
        const cleaned = players.map((p) => p.trim()).filter(Boolean);
        if (cleaned.length === 0) { setError("Add at least one player to your roster."); setSubmitting(false); return; }
        await onSubmit({
          kind: "team", church, division,
          captain_name: captainName.trim(),
          players: cleaned,
        });
      } else {
        if (!agentName.trim()) { setError("Enter your name."); setSubmitting(false); return; }
        await onSubmit({
          kind: "free_agent", church, division,
          player_name: agentName.trim(),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-3">
        <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: C.rust, fontWeight: 700 }}>
          Step One
        </div>
        <h2 className="leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: C.ink }}>
          Sign Up
        </h2>
        <p className="mt-3 text-sm italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          Captains register their entire roster in one go. No team? Sign up as a free agent and
          we'll group you with others from across the conference.
        </p>
      </aside>

      <section className="lg:col-span-9 border p-6 md:p-8" style={{ borderColor: C.ink, background: C.paper }}>
        <FormBlock number="01" label="How are you registering?">
          <div className="grid sm:grid-cols-2 gap-3">
            <ChoiceCard
              active={kind === "team"} onClick={() => setKind("team")}
              title="Team Captain" icon={<Shield size={18} />}
              desc="I'll register my church team and add all players."
            />
            <ChoiceCard
              active={kind === "free_agent"} onClick={() => setKind("free_agent")}
              title="Free Agent" icon={<Flag size={18} />}
              desc="I don't have a team. Place me on a free-agent squad."
            />
          </div>
        </FormBlock>

        {kind && (
          <FormBlock number="02" label="Which church do you represent?">
            <select
              value={church} onChange={(e) => setChurch(e.target.value)}
              className="w-full px-4 py-3 border bg-transparent text-base focus:outline-none"
              style={{ borderColor: C.ink, color: C.ink }}
            >
              <option value="">— Select your church —</option>
              {CHURCHES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormBlock>
        )}

        {kind && church && (
          <FormBlock number="03" label="Division">
            <div className="grid sm:grid-cols-2 gap-3">
              <ChoiceCard active={division === "mens"} onClick={() => setDivision("mens")}
                title="Men's Division" icon={<Trophy size={18} />} />
              <ChoiceCard active={division === "womens"} onClick={() => setDivision("womens")}
                title="Women's Division" icon={<Trophy size={18} />} />
            </div>
          </FormBlock>
        )}

        {kind === "team" && division && (
          <FormBlock number="04" label="Roster">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                  Captain's Name
                </label>
                <input
                  value={captainName} onChange={(e) => setCaptainName(e.target.value)}
                  placeholder="e.g. Daniel Rivera"
                  className="w-full px-4 py-3 border bg-transparent focus:outline-none"
                  style={{ borderColor: C.ink, color: C.ink }}
                />
              </div>

              <div className="pt-2">
                <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ color: C.inkSoft }}>
                  Players (add as many as you need)
                </label>
                <div className="space-y-2">
                  {players.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="w-9 text-center py-3 text-sm font-bold"
                        style={{
                          background: C.ink, color: C.cream,
                          fontFamily: "'Bebas Neue', sans-serif", fontSize: 18,
                        }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <input
                        value={p} onChange={(e) => updatePlayer(i, e.target.value)}
                        placeholder={`Player ${i + 1} name`}
                        className="flex-1 px-4 py-3 border bg-transparent focus:outline-none"
                        style={{ borderColor: C.ink, color: C.ink }}
                      />
                      {players.length > 1 && (
                        <button type="button" onClick={() => removePlayer(i)}
                          className="px-3 py-3 border hover:opacity-70 transition-opacity"
                          style={{ borderColor: C.ink, color: C.ink }}
                          aria-label="Remove player">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addPlayerRow}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed text-sm uppercase tracking-wider hover:bg-white/40 transition-colors"
                  style={{ borderColor: C.ink, color: C.ink, fontWeight: 600 }}>
                  <Plus size={14} /> Add Another Player
                </button>
              </div>
            </div>
          </FormBlock>
        )}

        {kind === "free_agent" && division && (
          <FormBlock number="04" label="Your name">
            <input
              value={agentName} onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g. Sam Okonkwo"
              className="w-full px-4 py-3 border bg-transparent focus:outline-none"
              style={{ borderColor: C.ink, color: C.ink }}
            />
            <p className="mt-2 text-xs italic" style={{ color: C.inkSoft, fontFamily: "'Newsreader', serif" }}>
              Free agents are auto-grouped into teams of {FREE_AGENT_TEAM_SIZE} per division.
            </p>
          </FormBlock>
        )}

        {kind && (
          <div className="mt-8 pt-6 border-t" style={{ borderColor: C.line }}>
            {error && (
              <div className="mb-4 px-4 py-3 text-sm"
                style={{ background: "#FBE3DB", color: C.rustDark, border: `1px solid ${C.rust}` }}>
                {error}
              </div>
            )}
            <button onClick={handleSubmit} disabled={submitting}
              className="group inline-flex items-center gap-3 px-8 py-4 text-base uppercase tracking-widest transition-all hover:gap-5 disabled:opacity-60"
              style={{
                background: C.rust, color: C.cream,
                fontWeight: 700, letterSpacing: "0.15em",
              }}>
              {submitting ? (
                <><Loader2 className="animate-spin" size={18} /> Submitting…</>
              ) : (
                <>Submit Registration <ChevronRight size={18} /></>
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function FormBlock({ number, label, children }) {
  return (
    <div className="mb-7 pb-7 border-b last:border-b-0 last:mb-0 last:pb-0" style={{ borderColor: C.line }}>
      <div className="flex items-baseline gap-3 mb-3">
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 28,
          color: C.rust, letterSpacing: "0.05em",
        }}>
          {number}
        </span>
        <h3 className="text-sm uppercase tracking-[0.2em] font-bold" style={{ color: C.ink }}>
          {label}
        </h3>
      </div>
      {children}
    </div>
  );
}

function ChoiceCard({ active, onClick, title, desc, icon }) {
  return (
    <button type="button" onClick={onClick}
      className="text-left p-4 border-2 transition-all"
      style={{
        borderColor: active ? C.rust : C.ink,
        background: active ? C.ink : "transparent",
        color: active ? C.cream : C.ink,
      }}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-bold uppercase tracking-wider text-sm">{title}</span>
        {active && <Check size={16} className="ml-auto" style={{ color: C.rust }} />}
      </div>
      {desc && (
        <div className="text-xs leading-snug opacity-80 italic"
          style={{ fontFamily: "'Newsreader', serif" }}>
          {desc}
        </div>
      )}
    </button>
  );
}

function ConfirmScreen({ entry, onRegisterAnother, onViewRoster }) {
  if (!entry) return null;
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
        style={{ background: C.ink, color: C.cream }}>
        <Check size={28} strokeWidth={3} />
      </div>
      <h2 style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 64,
        lineHeight: 1, color: C.ink,
      }}>
        You're In.
      </h2>
      <p className="mt-3 italic text-lg" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
        {entry.kind === "team"
          ? `${entry.players?.length || 0} ${entry.players?.length === 1 ? "player" : "players"} registered for ${entry.church?.split("—")[0].trim()}.`
          : `You're on the free-agent list for the ${entry.division === "mens" ? "Men's" : "Women's"} division.`}
      </p>

      <div className="mt-8 flex gap-3 justify-center flex-wrap">
        <button onClick={onRegisterAnother}
          className="px-6 py-3 text-sm uppercase tracking-widest border-2"
          style={{ borderColor: C.ink, color: C.ink, fontWeight: 700 }}>
          Register Another
        </button>
        <button onClick={onViewRoster}
          className="px-6 py-3 text-sm uppercase tracking-widest"
          style={{ background: C.rust, color: C.cream, fontWeight: 700 }}>
          View Roster
        </button>
      </div>
    </div>
  );
}

function RosterView({ registrations, loading, onRemove }) {
  if (loading) return <LoadingState />;
  const teams = registrations.filter((r) => r.kind === "team");
  if (teams.length === 0) return <EmptyState message="No teams registered yet. Be the first." />;

  const mens = teams.filter((t) => t.division === "mens");
  const womens = teams.filter((t) => t.division === "womens");

  return (
    <div className="space-y-12">
      <DivisionBlock title="Men's Division" teams={mens} onRemove={onRemove} />
      <DivisionBlock title="Women's Division" teams={womens} onRemove={onRemove} />
    </div>
  );
}

function DivisionBlock({ title, teams, onRemove }) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b-2 pb-2 mb-6" style={{ borderColor: C.ink }}>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 44,
          lineHeight: 1, color: C.ink, letterSpacing: "0.02em",
        }}>
          {title}
        </h2>
        <span className="text-sm uppercase tracking-widest" style={{ color: C.inkSoft }}>
          {teams.length} {teams.length === 1 ? "team" : "teams"}
        </span>
      </div>

      {teams.length === 0 ? (
        <p className="italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          No teams in this division yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {teams.map((t) => <TeamCard key={t.id} team={t} onRemove={onRemove} />)}
        </div>
      )}
    </section>
  );
}

function TeamCard({ team, onRemove }) {
  const churchShort = team.church?.split("—")[0].trim() || "—";
  const churchLoc = team.church?.split("—")[1]?.trim();
  return (
    <article className="border p-5 relative group" style={{ borderColor: C.ink, background: C.paper }}>
      <button onClick={() => onRemove(team.id)}
        className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: C.rust }} title="Remove registration">
        <X size={16} />
      </button>

      <div className="text-[10px] uppercase tracking-[0.25em] mb-1"
        style={{ color: C.rust, fontWeight: 700 }}>
        {churchLoc || "—"}
      </div>
      <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, lineHeight: 1, color: C.ink }}>
        {churchShort}
      </h3>
      <div className="text-xs italic mt-1 mb-4" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
        Captain: {team.captain_name} · {team.players?.length || 0} players
      </div>

      <ol className="space-y-1.5">
        {(team.players || []).map((p, i) => (
          <li key={i} className="flex items-center gap-3 text-sm" style={{ color: C.ink }}>
            <span className="w-6 text-center text-xs"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: C.rust }}>
              {String(i + 1).padStart(2, "0")}
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

function FreeAgentsView({ registrations, loading, onRemove }) {
  if (loading) return <LoadingState />;
  const agents = registrations.filter((r) => r.kind === "free_agent");
  if (agents.length === 0) {
    return <EmptyState message="No free agents yet. Encourage solo players to sign up." />;
  }
  const mens = agents.filter((a) => a.division === "mens");
  const womens = agents.filter((a) => a.division === "womens");

  return (
    <div className="space-y-12">
      <FreeAgentDivision title="Men's Free Agents" agents={mens} onRemove={onRemove} />
      <FreeAgentDivision title="Women's Free Agents" agents={womens} onRemove={onRemove} />
    </div>
  );
}

function FreeAgentDivision({ title, agents, onRemove }) {
  const groups = [];
  for (let i = 0; i < agents.length; i += FREE_AGENT_TEAM_SIZE) {
    groups.push(agents.slice(i, i + FREE_AGENT_TEAM_SIZE));
  }

  return (
    <section>
      <div className="flex items-baseline justify-between border-b-2 pb-2 mb-6" style={{ borderColor: C.ink }}>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 44,
          lineHeight: 1, color: C.ink, letterSpacing: "0.02em",
        }}>
          {title}
        </h2>
        <span className="text-sm uppercase tracking-widest" style={{ color: C.inkSoft }}>
          {agents.length} {agents.length === 1 ? "player" : "players"} · {groups.length} {groups.length === 1 ? "squad" : "squads"}
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          No free agents in this division yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((g, idx) => (
            <article key={idx} className="border p-5" style={{ borderColor: C.ink, background: C.paper }}>
              <div className="text-[10px] uppercase tracking-[0.25em] mb-1"
                style={{ color: C.rust, fontWeight: 700 }}>
                Auto-Squad
              </div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, lineHeight: 1, color: C.ink }}>
                Free Agents {String.fromCharCode(65 + idx)}
              </h3>
              <div className="text-xs italic mt-1 mb-4" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
                {g.length} of {FREE_AGENT_TEAM_SIZE} players
              </div>
              <ol className="space-y-1.5">
                {g.map((a, i) => (
                  <li key={a.id} className="flex items-center gap-3 text-sm group">
                    <span className="w-6 text-center text-xs"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: C.rust }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 pb-0.5" style={{ color: C.ink }}>
                      <span className="border-b border-dotted pb-0.5" style={{ borderColor: C.line }}>
                        {a.player_name}
                      </span>
                      <span className="block text-[10px] uppercase tracking-widest mt-0.5"
                        style={{ color: C.inkSoft }}>
                        {a.church?.split("—")[0].trim()}
                      </span>
                    </span>
                    <button onClick={() => onRemove(a.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: C.rust }}>
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 py-12 justify-center" style={{ color: C.inkSoft }}>
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm uppercase tracking-widest">Loading registrations</span>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-16">
      <p className="italic text-lg" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
        {message}
      </p>
    </div>
  );
}
