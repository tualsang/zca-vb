import { useState, useMemo } from "react";
import {
  Trophy, X, Plus, Loader2, Shield, Flag, AlertTriangle, ChevronRight,
} from "lucide-react";
import { CHURCHES, C } from "../../lib/constants";
import { splitChurch, formatPhone, teamHeadcount, sanitizeNameInput } from "../../lib/helpers";
import { NameInput } from "../inputs/NameInput";
import { PhoneInput } from "../inputs/PhoneInput";
import { FormBlock } from "../shared/FormBlock";
import { ChoiceCard } from "../shared/ChoiceCard";

export function RegisterForm({ onSubmit, registrations, onSwitchToManage, isAdmin, registrationOpenForPublic }) {
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
    const next = [...players]; next[i] = sanitizeNameInput(v); setPlayers(next);
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
        if (captainPhone.length !== 10) { setError("Enter a valid 10-digit phone number."); setSubmitting(false); return; }
        const cleaned = players.map((p) => p.trim()).filter(Boolean);
        if (cleaned.length === 0) { setError("Add at least one player to your roster."); setSubmitting(false); return; }
        await onSubmit({
          kind: "team", church, division,
          captain_name: captainName.trim(),
          phone: formatPhone(captainPhone),
          players: cleaned,
        });
      } else {
        if (!agentName.trim()) { setError("Enter your name."); setSubmitting(false); return; }
        if (agentPhone.length !== 10) { setError("Enter a valid 10-digit phone number."); setSubmitting(false); return; }
        await onSubmit({
          kind: "free_agent", church, division,
          player_name: agentName.trim(),
          phone: formatPhone(agentPhone),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
      <aside className="lg:col-span-3">
        <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: C.rust, fontWeight: 700 }}>
          Step One
        </div>
        <h2 className="leading-none" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(40px, 10vw, 56px)", color: C.ink,
        }}>
          Sign Up
        </h2>
        <p className="mt-3 text-sm italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          Captains register their entire roster in one go. No team? Sign up as a free agent
          and we'll be in touch about placement.
        </p>
        {isAdmin && !registrationOpenForPublic && (
          <div className="mt-4 p-3 text-xs"
            style={{ background: C.warnBg, border: `1px solid ${C.warn}`, color: C.ink }}>
            <strong>Admin override:</strong> Public registration is closed, but you can still register on someone's behalf.
          </div>
        )}
      </aside>

      <section className="lg:col-span-9 border p-5 sm:p-6 md:p-8" style={{ borderColor: C.ink, background: C.paper }}>
        <FormBlock number="01" label="How are you registering?">
          <div className="grid sm:grid-cols-2 gap-3">
            <ChoiceCard active={kind === "team"} onClick={() => setKind("team")}
              title="Team Captain" icon={<Shield size={18} />}
              desc="I'll register my church team and add all players." />
            <ChoiceCard active={kind === "free_agent"} onClick={() => setKind("free_agent")}
              title="Free Agent" icon={<Flag size={18} />}
              desc="I don't have a team. I'm registering solo." />
          </div>
        </FormBlock>

        {kind && (
          <FormBlock number="02" label="Which church do you represent?">
            <select value={church} onChange={(e) => setChurch(e.target.value)}
              className="w-full px-4 py-3 border bg-transparent focus:outline-none"
              style={{ borderColor: C.ink, color: C.ink, fontSize: 16 }}>
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
            {kind === "team" && (
              <p className="mt-2 text-[11px] italic" style={{ color: C.inkSoft, fontFamily: "'Newsreader', serif" }}>
                Note: Once registered, division can only be changed by the organizers.
              </p>
            )}
          </FormBlock>
        )}

        {duplicateTeam && (
          <div className="mb-7 p-4 border-2"
            style={{ background: C.warnBg, borderColor: C.warn, color: C.ink }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} style={{ color: C.warn, flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold uppercase tracking-wider text-sm mb-1">
                  Heads up — this church already has a team
                </h4>
                <p className="text-sm leading-snug mb-3">
                  <strong>{duplicateTeam.captain_name}</strong> already registered{" "}
                  <strong>{splitChurch(duplicateTeam.church).name}</strong> for the{" "}
                  <strong>{duplicateTeam.division === "mens" ? "Men's" : "Women's"}</strong> Division
                  with {teamHeadcount(duplicateTeam)} players.
                </p>
                <p className="text-xs italic mb-3" style={{ fontFamily: "'Newsreader', serif" }}>
                  Did you mean to edit the existing team? If you're registering a second team
                  (e.g. an "A" and "B" squad), you can still proceed below.
                </p>
                <button onClick={onSwitchToManage}
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
                  <NameInput value={captainName} onChange={setCaptainName} placeholder="e.g. Cin Khup" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                    Captain's Phone
                  </label>
                  <PhoneInput value={captainPhone} onChange={setCaptainPhone} />
                  <p className="mt-1 text-[10px] italic" style={{ color: C.inkSoft, fontFamily: "'Newsreader', serif" }}>
                    For organizers only — not shown publicly.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ color: C.inkSoft }}>
                  Other Players (captain is automatically included)
                </label>
                <div className="space-y-2">
                  {players.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="w-9 text-center py-3 text-sm font-bold flex-shrink-0"
                        style={{
                          background: C.ink, color: C.cream,
                          fontFamily: "'Bebas Neue', sans-serif", fontSize: 18,
                        }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <NameInput value={p} onChange={(v) => updatePlayer(i, v)}
                        placeholder={`Player ${i + 1} name`} />
                      {players.length > 1 && (
                        <button type="button" onClick={() => removePlayer(i)}
                          className="px-3 py-3 border hover:opacity-70 transition-opacity flex-shrink-0"
                          style={{ borderColor: C.ink, color: C.ink }}
                          aria-label="Remove player">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addPlayerRow}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed text-xs sm:text-sm uppercase tracking-wider hover:bg-white/40 transition-colors"
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
                <NameInput value={agentName} onChange={setAgentName} placeholder="e.g. Sam Okonkwo" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                  Your Phone
                </label>
                <PhoneInput value={agentPhone} onChange={setAgentPhone} />
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
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-4 text-sm sm:text-base uppercase tracking-widest transition-all hover:gap-5 disabled:opacity-60"
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
