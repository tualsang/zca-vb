import { useState, useEffect, useMemo } from "react";
import {
  Trophy, Users, UserPlus, X, Plus, Check, ChevronRight,
  Loader2, Shield, Flag, KeyRound, AlertTriangle, Copy, ArrowLeft,
  Lock, LogOut,
} from "lucide-react";
import { supabase } from "./lib/supabase";

// ─────────────────────────────────────────────────────────────────────────
// EDIT YOUR CHURCH LIST HERE — these appear in the dropdown
// ─────────────────────────────────────────────────────────────────────────
const CHURCHES = [
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
  "Others",
];

const C = {
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
};

function splitChurch(full) {
  if (!full) return { name: "—", location: "" };
  const parts = full.split(/\s+[—-]\s+/);
  return {
    name: parts[0]?.trim() || full,
    location: parts.slice(1).join(" - ").trim(),
  };
}

function generateEditCode(churchName) {
  const prefix = (splitChurch(churchName).name || "TEAM")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
}

export default function App() {
  const [tab, setTab] = useState("register");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState(null);
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  // Watch auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = !!session;

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
    const editCode = entry.kind === "team" ? generateEditCode(entry.church) : null;
    const payload = editCode ? { ...entry, edit_code: editCode } : entry;

    const { data, error } = await supabase
      .from("registrations")
      .insert([payload])
      .select()
      .single();

    if (error) {
      alert("Something went wrong saving your registration. Please try again.\n\n" + error.message);
      return;
    }
    setJustSubmitted(data);
    setTab("confirm");
  };

  // Admin-only: removes any registration
  const removeRegistration = async (id) => {
    if (!isAdmin) return;
    if (!confirm("Remove this registration?")) return;
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) alert("Could not remove: " + error.message);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
                  ZCA Conference 2026
                </span>
                {isAdmin && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: C.ink, color: C.cream, letterSpacing: "0.15em" }}>
                    Admin
                  </span>
                )}
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
                Captains: Register your roster below.
                Others: Register as Free Agents
              </p>
            </div>
            <ScoreboardStats stats={stats} loading={loading} />
          </div>

          <nav className="mt-8 flex gap-1 flex-wrap">
            <TabButton active={tab === "register"} onClick={() => setTab("register")}>
              <UserPlus size={14} /> Register
            </TabButton>
            <TabButton active={tab === "manage"} onClick={() => setTab("manage")}>
              <KeyRound size={14} /> Manage My Team
            </TabButton>
            <TabButton active={tab === "roster"} onClick={() => setTab("roster")}>
              <Users size={14} /> Roster ({stats.players})
            </TabButton>
            <TabButton active={tab === "freeagents"} onClick={() => setTab("freeagents")}>
              <Flag size={14} /> Free Agents ({stats.freeAgents})
            </TabButton>
          </nav>
        </div>
      </header >

      <main className="max-w-6xl mx-auto px-6 py-10">
        {tab === "register" && (
          <RegisterForm onSubmit={addRegistration} registrations={registrations}
            onSwitchToManage={() => setTab("manage")} />
        )}
        {tab === "manage" && <ManageTeamFlow isAdmin={isAdmin} />}
        {tab === "confirm" && (
          <ConfirmScreen
            entry={justSubmitted}
            onRegisterAnother={() => { setJustSubmitted(null); setTab("register"); }}
            onViewRoster={() => setTab("roster")}
          />
        )}
        {tab === "roster" && (
          <RosterView registrations={registrations} loading={loading}
            isAdmin={isAdmin} onRemove={removeRegistration} />
        )}
        {tab === "freeagents" && (
          <FreeAgentsView registrations={registrations} loading={loading}
            isAdmin={isAdmin} onRemove={removeRegistration} />
        )}
      </main>

      <footer className="border-t mt-12 py-6 text-center text-xs uppercase tracking-widest"
        style={{ borderColor: C.line, color: C.inkSoft }}>
        <div>SEE YOU AT MARYLAND!</div>
        <div className="mt-3 flex justify-center gap-4 items-center">
          {isAdmin ? (
            <button onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              style={{ color: C.inkSoft }}>
              <LogOut size={11} /> Sign Out
            </button>
          ) : (
            <button onClick={() => setShowLogin(true)}
              className="inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              style={{ color: C.inkSoft }}>
              <Lock size={11} /> Admin
            </button>
          )}
        </div>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div >
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────

function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    const { error: dbError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(14, 26, 51, 0.7)" }}
      onClick={onClose}>
      <div className="w-full max-w-md border-2 p-6"
        style={{ borderColor: C.ink, background: C.cream }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2" style={{ color: C.rust }}>
            <Lock size={14} strokeWidth={2.5} />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold">
              Admin Login
            </span>
          </div>
          <button onClick={onClose}
            className="p-1 hover:opacity-70 transition-opacity"
            style={{ color: C.ink }}
            aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 44,
          lineHeight: 1, color: C.ink, letterSpacing: "0.02em",
        }}>
          Sign In
        </h2>
        <p className="mt-2 mb-5 text-sm italic"
          style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          Organizers only.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              autoFocus
              className="w-full px-4 py-3 border bg-transparent focus:outline-none"
              style={{ borderColor: C.ink, color: C.ink }}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              className="w-full px-4 py-3 border bg-transparent focus:outline-none"
              style={{ borderColor: C.ink, color: C.ink }}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 text-sm"
            style={{ background: "#FBE3DB", color: C.rustDark, border: `1px solid ${C.rust}` }}>
            {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm uppercase tracking-widest disabled:opacity-60"
          style={{ background: C.rust, color: C.cream, fontWeight: 700, letterSpacing: "0.15em" }}>
          {loading ? (
            <><Loader2 className="animate-spin" size={16} /> Signing In…</>
          ) : (
            <>Sign In <ChevronRight size={16} /></>
          )}
        </button>
      </div>
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

function RegisterForm({ onSubmit, registrations, onSwitchToManage }) {
  const [kind, setKind] = useState("");
  const [church, setChurch] = useState("");
  const [division, setDivision] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainPhone, setCaptainPhone] = useState("");
  const [players, setPlayers] = useState([""]);
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const duplicateTeam = useMemo(() => {
    if (kind !== "team" || !church || !division) return null;
    return registrations.find(
      (r) => r.kind === "team" && r.church === church && r.division === division
    );
  }, [kind, church, division, registrations]);

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
        if (!captainPhone.trim()) { setError("Enter the captain's phone number."); setSubmitting(false); return; }
        const cleaned = players.map((p) => p.trim()).filter(Boolean);
        if (cleaned.length === 0) { setError("Add at least one player to your roster."); setSubmitting(false); return; }
        await onSubmit({
          kind: "team", church, division,
          captain_name: captainName.trim(),
          phone: captainPhone.trim(),
          players: cleaned,
        });
      } else {
        if (!agentName.trim()) { setError("Enter your name."); setSubmitting(false); return; }
        if (!agentPhone.trim()) { setError("Enter your phone number."); setSubmitting(false); return; }
        await onSubmit({
          kind: "free_agent", church, division,
          player_name: agentName.trim(),
          phone: agentPhone.trim(),
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
          Captains register their entire roster in one go. No team? Sign up as a free agent
          and we'll be in touch about placement.
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
              desc="I don't have a team. I'm registering solo."
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

        {duplicateTeam && (
          <div className="mb-7 p-4 border-2"
            style={{ background: C.warnBg, borderColor: C.warn, color: C.ink }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} style={{ color: C.warn, flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1">
                <h4 className="font-bold uppercase tracking-wider text-sm mb-1">
                  Heads up — this church already has a team
                </h4>
                <p className="text-sm leading-snug mb-3">
                  <strong>{duplicateTeam.captain_name}</strong> already registered{" "}
                  <strong>{splitChurch(duplicateTeam.church).name}</strong> for the{" "}
                  <strong>{duplicateTeam.division === "mens" ? "Men's" : "Women's"}</strong> Division
                  with {duplicateTeam.players?.length || 0} players.
                </p>
                <p className="text-xs italic mb-3" style={{ fontFamily: "'Newsreader', serif" }}>
                  Did you mean to edit the existing team? If you're registering a second team
                  (e.g. an "A" and "B" squad), you can still proceed below.
                </p>
                <button
                  onClick={onSwitchToManage}
                  className="text-xs uppercase tracking-widest font-bold underline"
                  style={{ color: C.rustDark }}>
                  Manage existing team instead →
                </button>
              </div>
            </div>
          </div>
        )}

        {kind === "team" && division && (
          <FormBlock number="04" label="Roster">
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                    Captain's Name
                  </label>
                  <input
                    value={captainName} onChange={(e) => setCaptainName(e.target.value)}
                    placeholder="e.g. Cin Khup"
                    className="w-full px-4 py-3 border bg-transparent focus:outline-none"
                    style={{ borderColor: C.ink, color: C.ink }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                    Captain's Phone
                  </label>
                  <input
                    type="tel"
                    value={captainPhone} onChange={(e) => setCaptainPhone(e.target.value)}
                    placeholder="e.g. (555) 123-4567"
                    className="w-full px-4 py-3 border bg-transparent focus:outline-none"
                    style={{ borderColor: C.ink, color: C.ink }}
                  />
                  <p className="mt-1 text-[10px] italic" style={{ color: C.inkSoft, fontFamily: "'Newsreader', serif" }}>
                    For organizers only — not shown publicly.
                  </p>
                </div>
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
          <FormBlock number="04" label="Your details">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                  Your Name
                </label>
                <input
                  value={agentName} onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Sam Okonkwo"
                  className="w-full px-4 py-3 border bg-transparent focus:outline-none"
                  style={{ borderColor: C.ink, color: C.ink }}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                  Your Phone
                </label>
                <input
                  type="tel"
                  value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)}
                  placeholder="e.g. (555) 123-4567"
                  className="w-full px-4 py-3 border bg-transparent focus:outline-none"
                  style={{ borderColor: C.ink, color: C.ink }}
                />
                <p className="mt-1 text-[10px] italic" style={{ color: C.inkSoft, fontFamily: "'Newsreader', serif" }}>
                  For organizers only — not shown publicly.
                </p>
              </div>
            </div>
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
  const [copied, setCopied] = useState(false);
  if (!entry) return null;
  const churchName = splitChurch(entry.church).name;
  const editCode = entry.edit_code;

  const copyCode = () => {
    if (!editCode) return;
    navigator.clipboard.writeText(editCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
          ? `${entry.players?.length || 0} ${entry.players?.length === 1 ? "player" : "players"} registered for ${churchName}.`
          : `You're on the free-agent list for the ${entry.division === "mens" ? "Men's" : "Women's"} division.`}
      </p>

      {editCode && (
        <div className="mt-8 mx-auto max-w-md border-2 p-5 text-left"
          style={{ borderColor: C.ink, background: C.paper }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: C.rust }}>
            <KeyRound size={14} strokeWidth={2.5} />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold">
              Save your team code
            </span>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-2xl tracking-widest font-bold"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.15em", color: C.ink }}>
              {editCode}
            </code>
            <button onClick={copyCode}
              className="px-3 py-2 border-2 text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-white/40 transition-colors"
              style={{ borderColor: C.ink, color: C.ink, fontWeight: 700 }}>
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <p className="mt-3 text-xs italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
            Use this code on the <strong>Manage My Team</strong> tab to add or remove players,
            update phone, or change division. Anyone with this code can edit the team — share it
            only with your co-captain.
          </p>
        </div>
      )}

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

// ─── Manage My Team ───────────────────────────────────────────────────────

function ManageTeamFlow({ isAdmin }) {
  const [team, setTeam] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTeam = async () => {
    setError("");
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter your team code.");
      return;
    }
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("registrations")
      .select("*")
      .eq("edit_code", trimmed)
      .maybeSingle();
    setLoading(false);

    if (dbError) {
      setError("Something went wrong. Please try again.");
      return;
    }
    if (!data) {
      setError("No team found with that code. Double-check and try again.");
      return;
    }
    setTeam(data);
  };

  const handleBack = () => {
    setTeam(null);
    setCode("");
    setError("");
  };

  if (team) {
    return <EditTeamForm team={team} onBack={handleBack} isAdmin={isAdmin} />;
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-3">
        <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: C.rust, fontWeight: 700 }}>
          Captains Only
        </div>
        <h2 className="leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: C.ink }}>
          Manage Team
        </h2>
        <p className="mt-3 text-sm italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          Enter the team code you received when you registered. Lost it? Contact the organizers.
        </p>
      </aside>

      <section className="lg:col-span-9 border p-6 md:p-8" style={{ borderColor: C.ink, background: C.paper }}>
        <FormBlock number="01" label="Enter Team Code">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") loadTeam(); }}
              placeholder="e.g. FAIT-X7K2"
              autoCapitalize="characters"
              className="flex-1 px-4 py-3 border bg-transparent text-lg tracking-widest focus:outline-none"
              style={{ borderColor: C.ink, color: C.ink, fontFamily: "'Bebas Neue', sans-serif" }}
            />
            <button onClick={loadTeam} disabled={loading}
              className="px-6 py-3 text-sm uppercase tracking-widest disabled:opacity-60 flex items-center gap-2"
              style={{ background: C.rust, color: C.cream, fontWeight: 700 }}>
              {loading ? <><Loader2 className="animate-spin" size={16} /> Loading</> : <>Load Team <ChevronRight size={16} /></>}
            </button>
          </div>
          {error && (
            <div className="mt-4 px-4 py-3 text-sm"
              style={{ background: "#FBE3DB", color: C.rustDark, border: `1px solid ${C.rust}` }}>
              {error}
            </div>
          )}
        </FormBlock>
      </section>
    </div>
  );
}

function EditTeamForm({ team, onBack, isAdmin }) {
  const [captainName, setCaptainName] = useState(team.captain_name || "");
  const [captainPhone, setCaptainPhone] = useState(team.phone || "");
  const [division, setDivision] = useState(team.division);
  const [players, setPlayers] = useState(
    team.players && team.players.length > 0 ? [...team.players] : [""]
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const addPlayerRow = () => setPlayers([...players, ""]);
  const updatePlayer = (i, v) => {
    const next = [...players]; next[i] = v; setPlayers(next);
  };
  const removePlayer = (i) => setPlayers(players.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setError("");
    if (!captainName.trim()) return setError("Captain's name can't be empty.");
    if (!captainPhone.trim()) return setError("Captain's phone can't be empty.");
    const cleaned = players.map((p) => p.trim()).filter(Boolean);
    if (cleaned.length === 0) return setError("You need at least one player.");

    setSaving(true);
    const { error: dbError } = await supabase
      .from("registrations")
      .update({
        captain_name: captainName.trim(),
        phone: captainPhone.trim(),
        division,
        players: cleaned,
      })
      .eq("id", team.id);
    setSaving(false);

    if (dbError) {
      setError("Could not save changes: " + dbError.message);
      return;
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      alert("Only organizers can delete teams. Please contact the organizers.");
      return;
    }
    if (!confirm(`Delete the entire ${splitChurch(team.church).name} team registration? This cannot be undone.`)) return;
    const { error: dbError } = await supabase
      .from("registrations")
      .delete()
      .eq("id", team.id);
    if (dbError) {
      alert("Could not delete: " + dbError.message);
      return;
    }
    onBack();
  };

  const churchName = splitChurch(team.church).name;

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-3">
        <button onClick={onBack}
          className="inline-flex items-center gap-1 text-xs uppercase tracking-widest mb-4 hover:opacity-70"
          style={{ color: C.inkSoft, fontWeight: 700 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: C.rust, fontWeight: 700 }}>
          Editing
        </div>
        <h2 className="leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, color: C.ink }}>
          {churchName}
        </h2>
        <p className="mt-3 text-xs uppercase tracking-widest" style={{ color: C.inkSoft }}>
          Code: <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.1em", color: C.ink }}>
            {team.edit_code}
          </span>
        </p>
      </aside>

      <section className="lg:col-span-9 border p-6 md:p-8" style={{ borderColor: C.ink, background: C.paper }}>
        <FormBlock number="01" label="Division">
          <div className="grid sm:grid-cols-2 gap-3">
            <ChoiceCard active={division === "mens"} onClick={() => setDivision("mens")}
              title="Men's Division" icon={<Trophy size={18} />} />
            <ChoiceCard active={division === "womens"} onClick={() => setDivision("womens")}
              title="Women's Division" icon={<Trophy size={18} />} />
          </div>
        </FormBlock>

        <FormBlock number="02" label="Captain">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                Captain's Name
              </label>
              <input
                value={captainName} onChange={(e) => setCaptainName(e.target.value)}
                className="w-full px-4 py-3 border bg-transparent focus:outline-none"
                style={{ borderColor: C.ink, color: C.ink }}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                Captain's Phone
              </label>
              <input
                type="tel"
                value={captainPhone} onChange={(e) => setCaptainPhone(e.target.value)}
                className="w-full px-4 py-3 border bg-transparent focus:outline-none"
                style={{ borderColor: C.ink, color: C.ink }}
              />
            </div>
          </div>
        </FormBlock>

        <FormBlock number="03" label="Players">
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
        </FormBlock>

        <div className="mt-8 pt-6 border-t flex flex-wrap items-center gap-3" style={{ borderColor: C.line }}>
          {error && (
            <div className="w-full mb-2 px-4 py-3 text-sm"
              style={{ background: "#FBE3DB", color: C.rustDark, border: `1px solid ${C.rust}` }}>
              {error}
            </div>
          )}
          {savedFlash && (
            <div className="w-full mb-2 px-4 py-3 text-sm flex items-center gap-2"
              style={{ background: "#DDF1DE", color: "#2D5A3D", border: `1px solid #2D5A3D` }}>
              <Check size={16} /> Changes saved.
            </div>
          )}
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-3 px-8 py-4 text-base uppercase tracking-widest transition-all disabled:opacity-60"
            style={{
              background: C.rust, color: C.cream,
              fontWeight: 700, letterSpacing: "0.15em",
            }}>
            {saving ? (
              <><Loader2 className="animate-spin" size={18} /> Saving…</>
            ) : (
              <>Save Changes <Check size={18} /></>
            )}
          </button>
          {isAdmin && (
            <button onClick={handleDelete}
              className="ml-auto px-4 py-3 text-xs uppercase tracking-widest border-2 hover:bg-white/40 transition-colors"
              style={{ borderColor: C.ink, color: C.ink, fontWeight: 700 }}>
              Delete Team (Admin)
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Roster + Free Agents ─────────────────────────────────────────────────

function RosterView({ registrations, loading, isAdmin, onRemove }) {
  if (loading) return <LoadingState />;
  const teams = registrations.filter((r) => r.kind === "team");
  if (teams.length === 0) return <EmptyState message="No teams registered yet. Be the first." />;

  const mens = teams.filter((t) => t.division === "mens");
  const womens = teams.filter((t) => t.division === "womens");

  return (
    <div className="space-y-12">
      <DivisionBlock title="Men's Division" teams={mens} isAdmin={isAdmin} onRemove={onRemove} />
      <DivisionBlock title="Women's Division" teams={womens} isAdmin={isAdmin} onRemove={onRemove} />
    </div>
  );
}

function DivisionBlock({ title, teams, isAdmin, onRemove }) {
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
          {teams.map((t) => <TeamCard key={t.id} team={t} isAdmin={isAdmin} onRemove={onRemove} />)}
        </div>
      )}
    </section>
  );
}

function TeamCard({ team, isAdmin, onRemove }) {
  const { name: churchShort, location: churchLoc } = splitChurch(team.church);
  return (
    <article className="border p-5 relative group" style={{ borderColor: C.ink, background: C.paper }}>
      {isAdmin && (
        <button onClick={() => onRemove(team.id)}
          className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: C.rust }} title="Remove (Admin)">
          <X size={16} />
        </button>
      )}

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

function FreeAgentsView({ registrations, loading, isAdmin, onRemove }) {
  if (loading) return <LoadingState />;
  const agents = registrations.filter((r) => r.kind === "free_agent");
  if (agents.length === 0) {
    return <EmptyState message="No free agents yet." />;
  }
  const mens = agents.filter((a) => a.division === "mens");
  const womens = agents.filter((a) => a.division === "womens");

  return (
    <div className="space-y-12">
      <FreeAgentDivision title="Men's Free Agents" agents={mens} isAdmin={isAdmin} onRemove={onRemove} />
      <FreeAgentDivision title="Women's Free Agents" agents={womens} isAdmin={isAdmin} onRemove={onRemove} />
    </div>
  );
}

function FreeAgentDivision({ title, agents, isAdmin, onRemove }) {
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
                className="flex items-center gap-4 px-5 py-4 group"
                style={{
                  borderBottom: i < agents.length - 1 ? `1px solid ${C.line}` : "none",
                }}>
                <span className="w-10 text-center"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
                    color: C.rust, lineHeight: 1,
                  }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base truncate" style={{ color: C.ink }}>
                    {a.player_name}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest mt-0.5 truncate"
                    style={{ color: C.inkSoft }}>
                    {churchShort}{churchLoc ? ` · ${churchLoc}` : ""}
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => onRemove(a.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2"
                    style={{ color: C.rust }}
                    aria-label="Remove (Admin)">
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