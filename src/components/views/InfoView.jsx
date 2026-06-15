import { MapPin, Calendar, Clock, Trophy } from "lucide-react";
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
            <strong>Full Round Robin:</strong> Everyone plays everyone. Top 2 plays a championship match.
          </p>
          <p className="mb-3">
            <strong>Surface:</strong> All matches are played on grass.
          </p>
          <p>
            <strong>Schedule:</strong> All schedules are tentative and subject to change.
          </p>
        </Section>

        <Section title="Scoring">
          <ul className="space-y-2">
            <li><strong>Group Games: </strong>Best of 3 to 25: Cap at 30</li>
            <li><strong>Championship Match: </strong>Best of 3 to 25: No Cap</li>
            <li><strong>Rally Scoring: </strong>All sets to 25 and win by deuces.</li>
          </ul>
        </Section>

        <Section title="Prizes">
          <p className="mb-4">
            Trophies and medals for the top two teams in each division, plus a cash prize.
          </p>
          <PrizeGrid />
        </Section>

        <Section title="Rules">
          <RulesGrid rows={[
            ["Rotation", "Men ✓ · Women ✗"],
            ["10-Foot Line", "Men ✓ · Women ✗"],
            ["Foot Fault (under-net line)", "Not enforced"],
            ["Net Fault", "Enforced"],
            ["Doubles", "Not strict"],
            ["Carry", "Not strict"],
            ["Other Rules", "Up to Referees' Discretion"],
          ]} />
        </Section>

        <Section title="Contact">
          <p>
            Questions on tournament day? Call the organizer at{" "}
            <a href="tel:+17042016580" className="font-semibold"
              style={{ color: C.rust }}>
              (704) 201 6580
            </a>.
          </p>
        </Section>
      </section>
    </div >
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

function PrizeGrid() {
  const divisions = [
    { name: "Men's", places: [{ place: "1st", cash: 200 }, { place: "2nd", cash: 100 }] },
    { name: "Women's", places: [{ place: "1st", cash: 200 }, { place: "2nd", cash: 100 }] },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
      {divisions.map((div) => (
        <div key={div.name}>
          <div className="text-[10px] uppercase tracking-[0.25em] mb-3 pb-2"
            style={{ color: C.rust, fontWeight: 700, borderBottom: `1px solid ${C.line}` }}>
            {div.name} Division
          </div>
          <div className="space-y-3">
            {div.places.map((p) => {
              const isFirst = p.place === "1st";
              return (
                <div key={p.place} className="flex items-center gap-3 p-3"
                  style={{
                    border: `1px solid ${isFirst ? C.gold : C.line}`,
                    background: isFirst ? C.goldBg : "transparent",
                  }}>
                  <Trophy size={22} strokeWidth={2} style={{ color: isFirst ? C.gold : C.inkSoft, flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-widest" style={{ color: C.inkSoft, fontWeight: 700 }}>
                      {p.place} Place
                    </div>
                    <div className="text-sm sm:text-base" style={{ color: C.ink, fontFamily: "system-ui, sans-serif" }}>
                      Trophy · 8 Medals · <span style={{ fontWeight: 700, color: isFirst ? C.gold : C.ink }}>${p.cash}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
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