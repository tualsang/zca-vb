import { useState, useEffect } from "react";
import { X, Plus, Loader2, Phone } from "lucide-react";
import { C, CHURCHES } from "../../lib/constants";
import { splitChurch } from "../../lib/helpers";
import { LoadingState, EmptyState } from "../shared/Status";
import { supabase } from "../../lib/supabase";

// Admin panel: manually add a team row
function AdminAddTeam({ onAdded }) {
  const [selectedChurch, setSelectedChurch] = useState("");
  const [churchName, setChurchName] = useState("");   // editable name part
  const [churchLoc, setChurchLoc] = useState("");     // read-only location part
  const [division, setDivision] = useState("mens");
  const [captain, setCaptain] = useState("");
  const [saving, setSaving] = useState(false);

  // When dropdown changes, pre-fill the editable name from the selection
  useEffect(() => {
    if (!selectedChurch) { setChurchName(""); setChurchLoc(""); return; }
    const { name, location } = splitChurch(selectedChurch);
    setChurchName(name);
    setChurchLoc(location || "");
  }, [selectedChurch]);

  // Combine edited name + original location back into the church string
  const buildChurchValue = () =>
    churchLoc ? `${churchName.trim()} - ${churchLoc}` : churchName.trim();

  const handleAdd = async () => {
    if (!selectedChurch || !churchName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("registrations").insert([{
      kind: "team",
      church: buildChurchValue(),
      division,
      captain_name: captain.trim(),
      players: [],
    }]);
    if (error) alert("Could not add team: " + error.message);
    else {
      setSelectedChurch(""); setChurchName(""); setChurchLoc("");
      setCaptain(""); setDivision("mens");
      if (onAdded) onAdded();
    }
    setSaving(false);
  };

  return (
    <div className="border-2 border-dashed p-4 sm:p-5 mb-8" style={{ borderColor: C.ink, background: C.paper }}>
      <div className="text-[10px] uppercase tracking-[0.25em] mb-3 font-bold" style={{ color: C.rust }}>
        Admin · Add Team
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        {/* Church / Location dropdown */}
        <select
          value={selectedChurch}
          onChange={(e) => setSelectedChurch(e.target.value)}
          className="px-3 py-2 border bg-transparent focus:outline-none text-sm"
          style={{ borderColor: C.ink, color: selectedChurch ? C.ink : C.inkSoft }}
        >
          <option value="">— Church / Location —</option>
          {CHURCHES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Division */}
        <select
          value={division}
          onChange={(e) => setDivision(e.target.value)}
          className="px-3 py-2 border bg-transparent focus:outline-none text-sm"
          style={{ borderColor: C.ink, color: C.ink }}
        >
          <option value="mens">Men's Division</option>
          <option value="womens">Women's Division</option>
        </select>

        {/* Editable church name — only shown once a church is picked */}
        {selectedChurch && (
          <div className="sm:col-span-2 flex gap-2 items-center">
            <input
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              placeholder="Team / Church name"
              className="flex-1 px-3 py-2 border bg-transparent focus:outline-none text-sm"
              style={{ borderColor: C.ink, color: C.ink }}
            />
            {churchLoc && (
              <span className="text-xs uppercase tracking-widest px-3 py-2 flex-shrink-0"
                style={{ background: C.cream, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                {churchLoc}
              </span>
            )}
          </div>
        )}

        {/* Captain's Name (optional) */}
        {selectedChurch && (
          <div className="sm:col-span-2">
            <input
              value={captain}
              onChange={(e) => setCaptain(e.target.value)}
              placeholder="Captain's name (optional)"
              className="w-full px-3 py-2 border bg-transparent focus:outline-none text-sm"
              style={{ borderColor: C.ink, color: C.ink }}
            />
          </div>
        )}
      </div>

      <button
        onClick={handleAdd}
        disabled={saving || !selectedChurch || !churchName.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest transition-all disabled:opacity-50"
        style={{ background: C.ink, color: C.cream, fontWeight: 700 }}
      >
        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Plus size={14} /> Add Team</>}
      </button>
    </div>
  );
}

export function RosterView({ registrations, loading, isAdmin, onRemove }) {
  if (loading) return <LoadingState />;
  const teams = registrations.filter((r) => r.kind === "team");

  const mens = teams.filter((t) => t.division === "mens");
  const womens = teams.filter((t) => t.division === "womens");

  return (
    <div className="space-y-10 sm:space-y-12">
      {isAdmin && <AdminAddTeam />}
      {teams.length === 0 && !isAdmin && (
        <EmptyState message="No teams registered yet." />
      )}
      <DivisionBlock title="Men's Division" teams={mens} isAdmin={isAdmin} onRemove={onRemove} />
      <DivisionBlock title="Women's Division" teams={womens} isAdmin={isAdmin} onRemove={onRemove} />
    </div>
  );
}

function DivisionBlock({ title, teams, isAdmin, onRemove }) {
  if (teams.length === 0) return null;
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

      <div className="grid md:grid-cols-2 gap-4">
        {teams.map((t) => <TeamCard key={t.id} team={t} isAdmin={isAdmin} onRemove={onRemove} />)}
      </div>
    </section>
  );
}

function TeamCard({ team, isAdmin, onRemove }) {
  const { name: churchShort, location: churchLoc } = splitChurch(team.church);
  return (
    <article className="border p-4 sm:p-5 relative" style={{ borderColor: C.ink, background: C.paper }}>
      {isAdmin && (
        <button onClick={() => onRemove(team.id)}
          className="absolute top-2 right-2 p-1.5"
          style={{ color: C.rust }} title="Remove (Admin)">
          <X size={16} />
        </button>
      )}

      {/* Location eyebrow */}
      <div className="text-[10px] uppercase tracking-[0.25em] mb-1 pr-6"
        style={{ color: C.rust, fontWeight: 700 }}>
        {churchLoc || "—"}
      </div>

      {/* Church / team name */}
      <h3 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(22px, 6vw, 28px)", lineHeight: 1, color: C.ink,
      }}>
        {churchShort}
      </h3>

      {/* Captain's name — shown only if set */}
      {team.captain_name && (
        <div className="text-xs italic mt-1" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          Captain: {team.captain_name}
        </div>
      )}

      {/* Admin-only: phone */}
      {isAdmin && team.phone && (
        <div className="mt-3 px-3 py-2 text-[11px] inline-flex items-center gap-1"
          style={{ background: C.cream, border: `1px dashed ${C.ink}`, color: C.inkSoft }}>
          <Phone size={11} />
          <a href={`tel:${(team.phone || "").replace(/\D/g, "")}`}
            className="underline" style={{ color: C.ink }}>
            {team.phone}
          </a>
        </div>
      )}
    </article>
  );
}
