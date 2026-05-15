import { MapPin, Calendar, Clock } from "lucide-react";
import { C, EVENT_DATE_DISPLAY, EVENT_TIME_DISPLAY, EVENT_ADDRESS } from "../../lib/constants";

export function InfoView() {
  const mapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(EVENT_ADDRESS)}`;

  return (
    <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
      <aside className="lg:col-span-3">
        <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: C.rust, fontWeight: 700 }}>
          Event Details
        </div>
        <h2 className="leading-none" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(40px, 10vw, 56px)", color: C.ink,
        }}>
          Info
        </h2>
        <p className="mt-3 text-sm italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          Everything you need to know before tournament day.
        </p>
      </aside>

      <section className="lg:col-span-9 space-y-5">
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          <InfoCard icon={<Calendar size={18} />} label="Date" value={EVENT_DATE_DISPLAY} />
          <InfoCard icon={<Clock size={18} />} label="Time" value={EVENT_TIME_DISPLAY} />
        </div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="block border p-5 hover:bg-white/40 transition-colors"
          style={{ borderColor: C.ink, background: C.paper }}>
          <div className="flex items-center gap-2 mb-1" style={{ color: C.rust }}>
            <MapPin size={14} strokeWidth={2.5} />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold">Location</span>
          </div>
          <div className="font-semibold text-base sm:text-lg" style={{ color: C.ink }}>
            {EVENT_ADDRESS}
          </div>
          <div className="text-[11px] uppercase tracking-widest mt-1" style={{ color: C.inkSoft }}>
            Tap to open in Apple Maps →
          </div>
        </a>

        <Section title="Tournament Format">
          <p className="mb-3">
            <strong>Full round robin</strong> [4-5 Teams]. Everyone plays everyone. Top 2 plays a championship match.
          </p>
          <p>
            <strong>Pool play → single-elimination bracket</strong> [6+ Teams]. Split teams into 2 pools,
            round-robin within the pool, then top 2 from each pool advance to a 4-team bracket.
          </p>
        </Section>

        <Section title="Scoring">
          <ul className="space-y-2">
            <li><strong>Pool play:</strong> Rally Scoring: 2 sets to 21.</li>
            <li><strong>Bracket quarters / semis:</strong> Best 2-of-3 to 21, third set to 15.</li>
            <li><strong>Championship:</strong> Best 2-of-3 to 25, third set to 15.</li>
          </ul>
        </Section>

        <Section title="Rules">
          <RulesGrid rows={[
            ["Rotation", "Please Rotate"],
            ["10-Foot Line", "Men ✓ · Women ✗"],
            ["Foot Fault (under-net line)", "Not enforced"],
            ["Net Fault", "Enforced"],
            ["Doubles", "Not strict"],
            ["Carry", "SUPER STRICT"],
          ]} />
        </Section>
      </section>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="border p-5" style={{ borderColor: C.ink, background: C.paper }}>
      <div className="flex items-center gap-2 mb-1" style={{ color: C.rust }}>
        {icon}
        <span className="text-[10px] tracking-[0.25em] uppercase font-bold">{label}</span>
      </div>
      <div className="font-semibold text-base sm:text-lg" style={{ color: C.ink }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border p-5 sm:p-6" style={{ borderColor: C.ink, background: C.paper }}>
      <h3 className="mb-3" style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(24px, 6vw, 32px)",
        color: C.ink, letterSpacing: "0.02em", lineHeight: 1,
      }}>
        {title}
      </h3>
      <div className="text-sm sm:text-base leading-relaxed" style={{ color: C.ink, fontFamily: "'Newsreader', serif" }}>
        {children}
      </div>
    </div>
  );
}

function RulesGrid({ rows }) {
  return (
    <div>
      {rows.map(([label, value], i) => (
        <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-2"
          style={{ borderTop: i > 0 ? `1px dotted ${C.line}` : "none" }}>
          <div className="text-[10px] uppercase tracking-widest sm:w-56 flex-shrink-0" style={{ color: C.inkSoft, fontWeight: 700 }}>
            {label}
          </div>
          <div className="text-sm sm:text-base" style={{ color: C.ink, fontFamily: "system-ui, sans-serif" }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
