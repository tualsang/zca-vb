import { useState, useEffect, useMemo } from "react";
import {
  Trophy, Users, UserPlus,
  Flag, Lock, LogOut, Info, CalendarDays,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { C } from "./lib/constants";
import { isRegistrationOpen } from "./lib/phase";
import { useCountdown } from "./hooks/useCountdown";
import { CountdownBanner } from "./components/header/CountdownBanner";

import { TabButton } from "./components/shared/TabButton";
import { LoginModal } from "./components/auth/LoginModal";
import { RegisterForm } from "./components/views/RegisterForm";
import { ConfirmScreen } from "./components/views/ConfirmScreen";

import { RosterView } from "./components/views/RosterView";
import { FreeAgentsView } from "./components/views/FreeAgentsView";
import { InfoView } from "./components/views/InfoView";
import { RegistrationClosedView } from "./components/views/RegistrationClosedView";
import { ScheduleView } from "./components/views/ScheduleView";

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
    const { data, error } = await supabase
      .from("registrations").insert([entry]).select().single();
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
    let teams = 0, freeAgents = 0;
    registrations.forEach((r) => {
      if (r.kind === "team") teams++;
      else freeAgents++;
    });
    return { teams, freeAgents };
  }, [registrations]);

  // Public registration is only open in phase 1. Admin can always register.
  const registrationOpenForPublic = isRegistrationOpen(phase);
  const canShowRegisterForm = registrationOpenForPublic || isAdmin;

  // Free agents matter only while registration is open. After it closes the
  // tab is hidden from the public, but the admin keeps it for squad placement.
  const showFreeAgents = registrationOpenForPublic || isAdmin;

  // The schedule is the inverse: shown to the public once registration ends
  // (replacing Free Agents), and available to the admin at any time for setup.
  const showSchedule = !registrationOpenForPublic || isAdmin;

  // If the phase flips while a public visitor is on a now-hidden tab, bounce
  // them to the roster instead of leaving a blank panel.
  useEffect(() => {
    if (!showFreeAgents && tab === "freeagents") setTab("roster");
    if (!showSchedule && tab === "schedule") setTab("roster");
  }, [showFreeAgents, showSchedule, tab]);

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
            Captains register your team to{" "}
            <a href="tel:7042016580" style={{ color: C.rust }}>704 201 6580</a>.
            <br />
            If you don't have a team but want to play as a free agent, please register below.
          </p>

          <CountdownBanner countdown={countdown} isAdmin={isAdmin} />



          <nav className="mt-5 sm:mt-6">
            {/* Mobile: 2-row grid. Desktop: single row flex */}
            <div className="grid grid-cols-2 sm:hidden gap-1.5">
              <TabButton active={tab === "register"} onClick={() => switchTab("register")} primary fullWidth>
                <UserPlus size={14} /> Register
              </TabButton>
              <TabButton active={tab === "roster"} onClick={() => switchTab("roster")} fullWidth>
                <Users size={14} /> Team List <span className="opacity-70">({stats.teams})</span>
              </TabButton>
              {showFreeAgents && (
                <TabButton active={tab === "freeagents"} onClick={() => switchTab("freeagents")} fullWidth>
                  <Flag size={14} /> Free Agents <span className="opacity-70">({stats.freeAgents})</span>
                </TabButton>
              )}
              {showSchedule && (
                <TabButton active={tab === "schedule"} onClick={() => switchTab("schedule")} fullWidth>
                  <CalendarDays size={14} /> Schedule
                </TabButton>
              )}
              <TabButton active={tab === "info"} onClick={() => switchTab("info")} fullWidth>
                <Info size={14} /> Info
              </TabButton>
            </div>
            <div className="hidden sm:flex gap-2 flex-wrap items-stretch justify-center">
              <TabButton active={tab === "register"} onClick={() => switchTab("register")} primary>
                <UserPlus size={14} /> Register
              </TabButton>
              <TabButton active={tab === "roster"} onClick={() => switchTab("roster")}>
                <Users size={14} /> Team List <span className="opacity-70">({stats.teams})</span>
              </TabButton>
              {showFreeAgents && (
                <TabButton active={tab === "freeagents"} onClick={() => switchTab("freeagents")}>
                  <Flag size={14} /> Free Agents <span className="opacity-70">({stats.freeAgents})</span>
                </TabButton>
              )}
              {showSchedule && (
                <TabButton active={tab === "schedule"} onClick={() => switchTab("schedule")}>
                  <CalendarDays size={14} /> Schedule
                </TabButton>
              )}
              <TabButton active={tab === "info"} onClick={() => switchTab("info")}>
                <Info size={14} /> Info
              </TabButton>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {tab === "register" && (
          canShowRegisterForm ? (
            <RegisterForm onSubmit={addRegistration} registrations={registrations}
              isAdmin={isAdmin}
              registrationOpenForPublic={registrationOpenForPublic} />
          ) : (
            <RegistrationClosedView
              phase={phase}
              onSwitchToRoster={() => switchTab("roster")} />
          )
        )}

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
        {tab === "freeagents" && showFreeAgents && (
          <FreeAgentsView registrations={registrations} loading={loading}
            isAdmin={isAdmin} onRemove={removeRegistration} />
        )}
        {tab === "schedule" && showSchedule && <ScheduleView isAdmin={isAdmin} />}
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