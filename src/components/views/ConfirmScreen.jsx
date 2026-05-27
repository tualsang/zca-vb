import { Check } from "lucide-react";
import { C } from "../../lib/constants";
import { splitChurch } from "../../lib/helpers";

export function ConfirmScreen({ entry, onRegisterAnother, onViewRoster }) {
  if (!entry) return null;
  const churchName = splitChurch(entry.church).name;

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
        You're on the free-agent list for the {entry.division === "mens" ? "Men's" : "Women's"} division from {churchName}. We'll be in touch about placement.
      </p>


      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onRegisterAnother}
          className="px-6 py-3 text-sm uppercase tracking-widest border-2"
          style={{ borderColor: C.ink, color: C.ink, fontWeight: 700 }}>
          Register Another
        </button>
        <button onClick={onViewRoster}
          className="px-6 py-3 text-sm uppercase tracking-widest"
          style={{ background: C.rust, color: C.cream, fontWeight: 700 }}>
          View Team List
        </button>
      </div>
    </div>
  );
}
