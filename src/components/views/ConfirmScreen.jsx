import { useState } from "react";
import { Check, KeyRound, Copy } from "lucide-react";
import { C } from "../../lib/constants";
import { splitChurch, teamHeadcount } from "../../lib/helpers";

export function ConfirmScreen({ entry, onRegisterAnother, onViewRoster }) {
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

  const headcount = entry.kind === "team" ? teamHeadcount(entry) : 1;

  return (
    <div className="max-w-2xl mx-auto text-center py-8 sm:py-12">
      <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-5 sm:mb-6"
        style={{ background: C.ink, color: C.cream }}>
        <Check size={28} strokeWidth={3} />
      </div>
      <h2 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(48px, 12vw, 64px)",
        lineHeight: 1, color: C.ink,
      }}>
        You're In.
      </h2>
      <p className="mt-3 italic text-base sm:text-lg px-2"
        style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
        {entry.kind === "team"
          ? `${headcount} ${headcount === 1 ? "player" : "players"} registered for ${churchName}.`
          : `You're on the free-agent list for the ${entry.division === "mens" ? "Men's" : "Women's"} division.`}
      </p>

      {editCode && (
        <div className="mt-6 sm:mt-8 mx-auto max-w-md border-2 p-4 sm:p-5 text-left"
          style={{ borderColor: C.ink, background: C.paper }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: C.rust }}>
            <KeyRound size={14} strokeWidth={2.5} />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold">
              Save your team code
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <code className="flex-1 text-xl sm:text-2xl tracking-widest font-bold"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.15em", color: C.ink }}>
              {editCode}
            </code>
            <button onClick={copyCode}
              className="px-3 py-2 border-2 text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-white/40 transition-colors flex-shrink-0"
              style={{ borderColor: C.ink, color: C.ink, fontWeight: 700 }}>
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <p className="mt-3 text-xs italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
            Use this code on the <strong>Manage My Team</strong> tab to add or remove players,
            update phone, or change captain. Anyone with this code can edit the team — share it
            only with your co-captain.
          </p>
        </div>
      )}

      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center">
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
