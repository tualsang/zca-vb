import { Lock, Trophy, PartyPopper } from "lucide-react";
import { C } from "../../lib/constants";

export function RegistrationClosedView({ phase, onSwitchToRoster }) {
  // Different copy for each post-registration phase
  const config = {
    pre_event: {
      icon: <Lock size={28} strokeWidth={2.5} />,
      iconBg: C.warn,
      title: "Registration Closed",
      message: "The deadline was June 14, 2026 at 11:59 PM EDT. The tournament begins July 10.",
    },
    live: {
      icon: <PartyPopper size={28} strokeWidth={2.5} />,
      iconBg: C.live,
      title: "Tournament In Progress",
      message: "The tournament is happening right now in Maryland! Registration has closed.",
    },
    complete: {
      icon: <Trophy size={28} strokeWidth={2.5} />,
      iconBg: C.gold,
      title: "Tournament Complete",
      message: "The 2026 ZCA Conference Volleyball Tournament has concluded. Thank you all for participating! Congratulations to the Champions.",
    },
  };

  const c = config[phase] || config.pre_event;

  return (
    <div className="max-w-2xl mx-auto text-center py-12 sm:py-16">
      <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-5"
        style={{ background: c.iconBg, color: C.cream }}>
        {c.icon}
      </div>
      <h2 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(40px, 10vw, 56px)",
        lineHeight: 1, color: C.ink,
      }}>
        {c.title}
      </h2>
      <p className="mt-3 italic text-base sm:text-lg px-2"
        style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
        {c.message}
      </p>
      <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onSwitchToRoster}
          className="px-6 py-3 text-sm uppercase tracking-widest"
          style={{ background: C.rust, color: C.cream, fontWeight: 700 }}>
          View Team List
        </button>
      </div>
    </div>
  );
}
