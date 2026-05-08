import { useState } from "react";
import {
  Trophy, X, Plus, Check, ChevronRight,
  Loader2, ArrowLeft, Lock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { C } from "../../lib/constants";
import { splitChurch, formatPhone, sanitizeNameInput } from "../../lib/helpers";
import { NameInput } from "../inputs/NameInput";
import { PhoneInput } from "../inputs/PhoneInput";
import { FormBlock } from "../shared/FormBlock";
import { ChoiceCard } from "../shared/ChoiceCard";

export function ManageTeamFlow({ isAdmin }) {
  const [team, setTeam] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTeam = async () => {
    setError("");
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Enter your team code."); return; }
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("registrations").select("*").eq("edit_code", trimmed).maybeSingle();
    setLoading(false);
    if (dbError) { setError("Something went wrong. Please try again."); return; }
    if (!data) { setError("No team found with that code. Double-check and try again."); return; }
    setTeam(data);
  };

  const handleBack = () => { setTeam(null); setCode(""); setError(""); };

  if (team) return <EditTeamForm team={team} onBack={handleBack} isAdmin={isAdmin} />;

  return (
    <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
      <aside className="lg:col-span-3">
        <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: C.rust, fontWeight: 700 }}>
          Captains Only
        </div>
        <h2 className="leading-none" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(40px, 10vw, 56px)", color: C.ink,
        }}>
          Manage Team
        </h2>
        <p className="mt-3 text-sm italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          Enter the team code you received when you registered. Lost it? Contact the organizers.
        </p>
      </aside>

      <section className="lg:col-span-9 border p-5 sm:p-6 md:p-8" style={{ borderColor: C.ink, background: C.paper }}>
        <FormBlock number="01" label="Enter Team Code">
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") loadTeam(); }}
              placeholder="e.g. FAIT-X7K2" autoCapitalize="characters"
              className="flex-1 px-4 py-3 border bg-transparent text-lg tracking-widest focus:outline-none"
              style={{ borderColor: C.ink, color: C.ink, fontFamily: "'Bebas Neue', sans-serif" }} />
            <button onClick={loadTeam} disabled={loading}
              className="px-6 py-3 text-sm uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-2"
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
  const [captainPhone, setCaptainPhone] = useState(
    (team.phone || "").replace(/\D/g, "").slice(0, 10)
  );
  const [division, setDivision] = useState(team.division);
  const [players, setPlayers] = useState(
    team.players && team.players.length > 0 ? [...team.players] : [""]
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const addPlayerRow = () => setPlayers([...players, ""]);
  const updatePlayer = (i, v) => {
    const next = [...players]; next[i] = sanitizeNameInput(v); setPlayers(next);
  };
  const removePlayer = (i) => setPlayers(players.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setError("");
    if (!captainName.trim()) return setError("Captain's name can't be empty.");
    if (captainPhone.length !== 10) return setError("Enter a valid 10-digit phone number.");
    const cleaned = players.map((p) => p.trim()).filter(Boolean);
    if (cleaned.length === 0) return setError("You need at least one player.");

    setSaving(true);
    const updatePayload = {
      captain_name: captainName.trim(),
      phone: formatPhone(captainPhone),
      players: cleaned,
    };
    if (isAdmin) updatePayload.division = division;

    const { error: dbError } = await supabase
      .from("registrations").update(updatePayload).eq("id", team.id);
    setSaving(false);
    if (dbError) { setError("Could not save changes: " + dbError.message); return; }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      alert("Only organizers can delete teams. Please contact the organizers.");
      return;
    }
    if (!confirm(`Delete the entire ${splitChurch(team.church).name} team registration? This cannot be undone.`)) return;
    const { error: dbError } = await supabase.from("registrations").delete().eq("id", team.id);
    if (dbError) { alert("Could not delete: " + dbError.message); return; }
    onBack();
  };

  const churchName = splitChurch(team.church).name;
  const divisionLabel = team.division === "mens" ? "Men's Division" : "Women's Division";

  return (
    <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
      <aside className="lg:col-span-3">
        <button onClick={onBack}
          className="inline-flex items-center gap-1 text-xs uppercase tracking-widest mb-4 hover:opacity-70"
          style={{ color: C.inkSoft, fontWeight: 700 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: C.rust, fontWeight: 700 }}>
          Editing
        </div>
        <h2 className="leading-none break-words" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(32px, 8vw, 44px)", color: C.ink,
        }}>
          {churchName}
        </h2>
        <p className="mt-3 text-xs uppercase tracking-widest" style={{ color: C.inkSoft }}>
          Code: <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.1em", color: C.ink }}>
            {team.edit_code}
          </span>
        </p>
      </aside>

      <section className="lg:col-span-9 border p-5 sm:p-6 md:p-8" style={{ borderColor: C.ink, background: C.paper }}>
        <FormBlock number="01" label="Division">
          {isAdmin ? (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <ChoiceCard active={division === "mens"} onClick={() => setDivision("mens")}
                  title="Men's Division" icon={<Trophy size={18} />} />
                <ChoiceCard active={division === "womens"} onClick={() => setDivision("womens")}
                  title="Women's Division" icon={<Trophy size={18} />} />
              </div>
              <p className="mt-2 text-[11px] italic" style={{ color: C.inkSoft, fontFamily: "'Newsreader', serif" }}>
                Admin override: division can be changed.
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 border-2"
              style={{ borderColor: C.line, background: C.cream }}>
              <Trophy size={18} style={{ color: C.rust }} />
              <span className="font-bold uppercase tracking-wider text-sm" style={{ color: C.ink }}>
                {divisionLabel}
              </span>
              <Lock size={14} className="ml-auto" style={{ color: C.inkSoft }} />
            </div>
          )}
          {!isAdmin && (
            <p className="mt-2 text-[11px] italic" style={{ color: C.inkSoft, fontFamily: "'Newsreader', serif" }}>
              Division is locked once registered. Contact the organizers if you need to change it.
            </p>
          )}
        </FormBlock>

        <FormBlock number="02" label="Captain">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                Captain's Name
              </label>
              <NameInput value={captainName} onChange={setCaptainName} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                Captain's Phone
              </label>
              <PhoneInput value={captainPhone} onChange={setCaptainPhone} />
            </div>
          </div>
        </FormBlock>

        <FormBlock number="03" label="Players">
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
                    style={{ borderColor: C.ink, color: C.ink }} aria-label="Remove player">
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
        </FormBlock>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderColor: C.line }}>
          {error && (
            <div className="w-full mb-2 px-4 py-3 text-sm"
              style={{ background: "#FBE3DB", color: C.rustDark, border: `1px solid ${C.rust}` }}>
              {error}
            </div>
          )}
          {savedFlash && (
            <div className="w-full mb-2 px-4 py-3 text-sm flex items-center gap-2"
              style={{ background: C.okBg, color: C.ok, border: `1px solid ${C.ok}` }}>
              <Check size={16} /> Changes saved.
            </div>
          )}
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-4 text-sm sm:text-base uppercase tracking-widest transition-all disabled:opacity-60"
            style={{ background: C.rust, color: C.cream, fontWeight: 700, letterSpacing: "0.15em" }}>
            {saving ? (
              <><Loader2 className="animate-spin" size={18} /> Saving…</>
            ) : (
              <>Save Changes <Check size={18} /></>
            )}
          </button>
          {isAdmin && (
            <button onClick={handleDelete}
              className="sm:ml-auto px-4 py-3 text-xs uppercase tracking-widest border-2 hover:bg-white/40 transition-colors"
              style={{ borderColor: C.ink, color: C.ink, fontWeight: 700 }}>
              Delete Team (Admin)
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
