import { Clock, AlertTriangle, Trophy, PartyPopper } from "lucide-react";
import { C } from "../../lib/constants";

export function CountdownBanner({ countdown, isAdmin }) {
  const { phase, days, hours, minutes, seconds } = countdown;

  // Phase 4: event complete — thank you / congratulations
  if (phase === "complete") {
    return (
      <div className="mt-5 p-4 sm:p-5 border-2 text-center"
        style={{ background: C.goldBg, borderColor: C.gold }}>
        <div className="flex items-center justify-center gap-2 mb-2" style={{ color: C.gold }}>
          <Trophy size={18} strokeWidth={2.5} />
          <span className="text-xs sm:text-sm uppercase tracking-widest font-bold">
            Tournament Complete
          </span>
          <Trophy size={18} strokeWidth={2.5} />
        </div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(22px, 5vw, 32px)",
          color: C.ink, lineHeight: 1.1, letterSpacing: "0.02em",
        }}>
          Thank you all for participating!
        </div>
        <div className="mt-2 italic text-sm sm:text-base"
          style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          Congratulations to the Champions 🏆
        </div>
      </div>
    );
  }

  // Phase 3: live — bright green celebratory banner
  if (phase === "live") {
    return (
      <div className="mt-5 p-4 sm:p-5 border-2 text-center relative overflow-hidden"
        style={{ background: C.liveBg, borderColor: C.live }}>
        {/* Subtle pulse dot */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: C.live }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: C.live }} />
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold"
            style={{ color: C.live }}>
            Live
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-1" style={{ color: C.live }}>
          <PartyPopper size={20} strokeWidth={2.5} />
        </div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(28px, 7vw, 44px)",
          color: C.ink, lineHeight: 1, letterSpacing: "0.02em",
        }}>
          Volleyball Tournament <span style={{ color: C.live }}>is LIVE</span>
        </div>
        <div className="mt-2 italic text-sm sm:text-base"
          style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          Going on now in Maryland — good luck to all teams!
        </div>
      </div>
    );
  }

  // Phase 2: pre-event — counting down to tournament start
  if (phase === "pre_event") {
    return (
      <CountdownDisplay
        label="Tournament Begins"
        sublabel="July 10, 2026 · 9:00 AM EDT"
        days={days} hours={hours} minutes={minutes} seconds={seconds}
        urgent={days < 3}
        accent={C.ink}
      />
    );
  }

  // Phase 1: pre-registration — counting down to deadline
  // Special case: countdown just expired but phase hasn't transitioned yet (race condition)
  if (countdown.expired) {
    return (
      <div className="mt-5 p-3 sm:p-4 border-2 flex items-center justify-center gap-3 text-center flex-wrap"
        style={{ background: C.warnBg, borderColor: C.warn }}>
        <AlertTriangle size={18} style={{ color: C.warn, flexShrink: 0 }} />
        <div>
          <div className="text-xs sm:text-sm uppercase tracking-widest font-bold" style={{ color: C.ink }}>
            Registration Closed
          </div>
          <div className="text-xs italic mt-0.5" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
            The deadline has passed.{isAdmin ? " You can still register as admin." : ""}
          </div>
        </div>
      </div>
    );
  }

  return (
    <CountdownDisplay
      label="Registration Closes"
      sublabel="June 14, 2026 · 11:59 PM EDT"
      days={days} hours={hours} minutes={minutes} seconds={seconds}
      urgent={days < 3}
      accent={C.rust}
    />
  );
}

function CountdownDisplay({ label, sublabel, days, hours, minutes, seconds, urgent, accent }) {
  const color = urgent ? C.rust : accent;
  return (
    <div className="mt-5 p-3 sm:p-4 border-2 text-center"
      style={{
        background: urgent ? "#FBE3DB" : C.paper,
        borderColor: color,
      }}>
      <div className="flex items-center justify-center gap-2 mb-2" style={{ color }}>
        <Clock size={14} />
        <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold">
          {label} — {sublabel}
        </span>
      </div>
      <div className="flex justify-center gap-3 sm:gap-5">
        <CountdownUnit value={days} label="Days" color={color} />
        <CountdownDivider color={color} />
        <CountdownUnit value={hours} label="Hrs" color={color} />
        <CountdownDivider color={color} />
        <CountdownUnit value={minutes} label="Min" color={color} />
        <CountdownDivider color={color} />
        <CountdownUnit value={seconds} label="Sec" color={color} />
      </div>
    </div>
  );
}

function CountdownUnit({ value, label, color }) {
  return (
    <div className="text-center min-w-[44px] sm:min-w-[56px]">
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(26px, 7vw, 36px)",
        lineHeight: 1, color,
        fontVariantNumeric: "tabular-nums",
      }}>
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[9px] sm:text-[10px] uppercase tracking-widest mt-1" style={{ color: C.inkSoft }}>
        {label}
      </div>
    </div>
  );
}

function CountdownDivider({ color }) {
  return (
    <div className="self-start" style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: "clamp(26px, 7vw, 36px)",
      lineHeight: 1, color, opacity: 0.5,
    }}>
      :
    </div>
  );
}
