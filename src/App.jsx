import { useState, useEffect, useMemo } from "react";
import {
  Trophy, Users, UserPlus, Loader2,
  KeyRound, Flag, Lock, LogOut, Info,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { C } from "./lib/constants";
import { teamHeadcount, generateEditCode } from "./lib/helpers";
import { isRegistrationOpen } from "./lib/phase";
import { useCountdown } from "./hooks/useCountdown";
import { CountdownBanner } from "./components/header/CountdownBanner";
import { ScoreboardStats } from "./components/header/ScoreboardStats";
import { TabButton } from "./components/shared/TabButton";
import { LoginModal } from "./components/auth/LoginModal";
import { RegisterForm } from "./components/views/RegisterForm";
import { ConfirmScreen } from "./components/views/ConfirmScreen";
import { ManageTeamFlow } from "./components/views/ManageTeamFlow";
import { RosterView } from "./components/views/RosterView";
import { FreeAgentsView } from "./components/views/FreeAgentsView";
import { InfoView } from "./components/views/InfoView";
import { RegistrationClosedView } from "./components/views/RegistrationClosedView";

export default function App() {
  const [tab, setTab] = useState("register");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState(null);
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const countdown = useCountdown();
  const phase = countdown.phase;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
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
    if (error) console.error("Load error:", error);
    else setRegistrations(data || []);
    setLoading(false);
  };

  const switchTab = (next) => {
    setTab(next);
    if (next === "roster" || next === "freeagents") loadRegistrations();
  };

  const addRegistration = async (entry) => {
    const editCode = entry.kind === "team" ? generateEditCode(entry.church) : null;
    const payload = editCode ? { ...entry, edit_code: editCode } : entry;
    const { data, error } = await supabase
      .from("registrations").insert([payload]).select().single();
    if (error) {
      alert("Something went wrong saving your registration. Please try again.\n\n" + error.message);
      return;
    }
    await loadRegistrations();
    setJustSubmitted(data);
    setTab("confirm");
  };

  const removeRegistration = async (id) => {
    if (!isAdmin) return;
    if (!confirm("Remove this registration?")) return;
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) alert("Could not remove: " + error.message);
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const stats = useMemo(() => {
    let players = 0, teams = 0, freeAgents = 0;
    registrations.forEach((r) => {
      if (r.kind === "team") {
        teams++;
        players += teamHeadcount(r);
      } else {
        freeAgents++;
        players++;
      }
    });
    return { players, teams, freeAgents };
  }, [registrations]);

  // Public registration is only open in phase 1. Admin can always register.
  const registrationOpenForPublic = isRegistrationOpen(phase);
  const canShowRegisterForm = registrationOpenForPublic || isAdmin;

  return (
    <div style={{ background: C.cream, color: C.ink, minHeight: "100vh" }}>
      <header className="border-b" style={{ borderColor: C.ink }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6">
          <div className="flex items-center gap-2 mb-1 flex-wrap" style={{ color: C.rust }}>
            <Trophy size={14} strokeWidth={2.5} />
            <span className="text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold">
              ZCA Conference 2026
            </span>
            {isAdmin && (
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest"
                style={{ background: C.ink, color: C.cream, letterSpacing: "0.15em" }}>
                Admin
              </span>
            )}
          </div>
          <h1 className="leading-none tracking-tight" style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(40px, 11vw, 88px)",
            color: C.ink, letterSpacing: "0.01em",
          }}>
            Volleyball <span style={{ color: C.rust }}>Tournament</span>
          </h1>
          <p className="mt-2 italic max-w-xl" style={{
            fontFamily: "'Newsreader', serif", color: C.inkSoft,
            fontSize: "clamp(14px, 4vw, 17px)",
          }}>
            Captains: Register your roster below.
            Others: Register as Free Agents
          </p>

          <CountdownBanner countdown={countdown} isAdmin={isAdmin} />

          <div className="mt-4 sm:mt-5 flex justify-center">
            <ScoreboardStats stats={stats} loading={loading} />
          </div>

          <nav className="mt-5 sm:mt-6 flex gap-1.5 sm:gap-2 flex-wrap items-stretch justify-center">
            <TabButton active={tab === "register"} onClick={() => switchTab("register")} primary>
              <UserPlus size={14} /> Register
            </TabButton>
            <TabButton active={tab === "manage"} onClick={() => switchTab("manage")}>
              <KeyRound size={14} /> <span className="hidden sm:inline">Manage My Team</span><span className="sm:hidden">Manage</span>
            </TabButton>
            <TabButton active={tab === "roster"} onClick={() => switchTab("roster")}>
              <Users size={14} /> Roster <span className="opacity-70">({stats.players})</span>
            </TabButton>
            <TabButton active={tab === "freeagents"} onClick={() => switchTab("freeagents")}>
              <Flag size={14} /> Free Agents <span className="opacity-70">({stats.freeAgents})</span>
            </TabButton>
            <TabButton active={tab === "info"} onClick={() => switchTab("info")}>
              <Info size={14} /> Info
            </TabButton>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {tab === "register" && (
          canShowRegisterForm ? (
            <RegisterForm onSubmit={addRegistration} registrations={registrations}
              onSwitchToManage={() => switchTab("manage")} isAdmin={isAdmin}
              registrationOpenForPublic={registrationOpenForPublic} />
          ) : (
            <RegistrationClosedView
              phase={phase}
              onSwitchToRoster={() => switchTab("roster")}
              onSwitchToManage={() => switchTab("manage")} />
          )
        )}
        {tab === "manage" && <ManageTeamFlow isAdmin={isAdmin} />}
        {tab === "confirm" && (
          <ConfirmScreen
            entry={justSubmitted}
            onRegisterAnother={() => { setJustSubmitted(null); switchTab("register"); }}
            onViewRoster={() => switchTab("roster")}
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
        {tab === "info" && <InfoView />}
      </main>

      <footer className="border-t mt-12 py-6 text-center text-[11px] sm:text-xs uppercase tracking-widest"
        style={{ borderColor: C.line, color: C.inkSoft }}>
        <div>SEE YOU AT MARYLAND!</div>
        <div className="mt-3">
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
    </div>
  );
}
