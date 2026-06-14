import { useState, useMemo } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { C } from "../../lib/constants";
import { LoadingState, EmptyState } from "../shared/Status";
import { useMatches } from "../../hooks/useMatches";

// ── pure helpers ────────────────────────────────────────────────────────────
const norm = (name) => (name || "").trim().toLowerCase();

function fmtTime(min) {
    const m = ((min % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const ap = h >= 12 ? "PM" : "AM";
    const hh = h % 12 || 12;
    return `${hh}:${String(mm).padStart(2, "0")} ${ap}`;
}

// Best of 3, free entry. A set counts once both-or-either score > 0.
function resultOf(pairs) {
    let wonA = 0, wonB = 0, pfA = 0, pfB = 0;
    (Array.isArray(pairs) ? pairs : []).forEach((p) => {
        const a = Number(p[0]) || 0;
        const b = Number(p[1]) || 0;
        pfA += a; pfB += b;
        if (a + b > 0) { if (a > b) wonA++; else if (b > a) wonB++; }
    });
    return { wonA, wonB, pfA, pfB, decided: Math.max(wonA, wonB) >= 2 };
}

function statusOf(teamA, teamB, pairs) {
    if (!teamA || !teamB) return "scheduled";
    const r = resultOf(pairs);
    if (r.decided) return "final";
    const played = (Array.isArray(pairs) ? pairs : []).some(
        (p) => (Number(p[0]) || 0) + (Number(p[1]) || 0) > 0
    );
    return played ? "live" : "scheduled";
}

const STATUS = {
    final: { label: "Final", bg: C.line, fg: C.ink },
    live: { label: "Live", bg: C.liveBg, fg: C.live },
    scheduled: { label: "Upcoming", bg: C.goldBg, fg: C.gold },
};

function cardLabel(m) {
    const div = m.division === "mens" ? "Men's" : "Women's";
    if (m.phase === "final") return `${div} Championship`;
    if (m.phase === "third_place") return `${div} 3rd Place`;
    return `Court ${m.court} · ${div}`;
}

function slotLabel(m) {
    if (m.phase === "final") return "Championship";
    if (m.phase === "third_place") return "Third Place";
    return `Round ${m.slot_index + 1}`;
}

function computeStandings(matches, division) {
    const rows = {};
    const ensure = (key, disp) => {
        if (!rows[key]) rows[key] = { name: disp, p: 0, w: 0, l: 0, sw: 0, sl: 0, pf: 0, pa: 0 };
    };
    const rr = matches.filter((m) => m.division === division && m.phase === "round_robin");

    // Register every team in the round-robin fixture first, so they all appear
    // in the table (with zeros) even before any scores are entered. Placeholder
    // names like M1..M4 / W1..W4 show until the admin renames them.
    rr.forEach((m) => {
        if (m.team_a) ensure(norm(m.team_a), m.team_a.trim());
        if (m.team_b) ensure(norm(m.team_b), m.team_b.trim());
    });

    rr.forEach((m) => {
        if (!m.team_a || !m.team_b) return;
        const r = resultOf(m.sets);
        // Count any game that has at least one set scored, decided or not.
        const played = (Array.isArray(m.sets) ? m.sets : []).some(
            (p) => (Number(p[0]) || 0) + (Number(p[1]) || 0) > 0
        );
        if (!played) return;
        const ka = norm(m.team_a), kb = norm(m.team_b);
        const A = rows[ka], B = rows[kb];
        A.p++; B.p++;
        // Award W/L to whoever currently leads on set wins; a tie leaves both unchanged.
        if (r.wonA > r.wonB) { A.w++; B.l++; }
        else if (r.wonB > r.wonA) { B.w++; A.l++; }
        A.sw += r.wonA; A.sl += r.wonB; B.sw += r.wonB; B.sl += r.wonA;
        A.pf += r.pfA; A.pa += r.pfB; B.pf += r.pfB; B.pa += r.pfA;
    });
    return Object.values(rows)
        .map((t) => ({
            ...t,
            setRatio: t.sl === 0 ? (t.sw > 0 ? Infinity : 0) : t.sw / t.sl,
            ptRatio: t.pa === 0 ? (t.pf > 0 ? Infinity : 0) : t.pf / t.pa,
        }))
        .sort(
            (x, y) =>
                y.w - x.w ||
                y.setRatio - x.setRatio ||
                y.ptRatio - x.ptRatio ||
                x.name.localeCompare(y.name)
        );
}

// Reads the playoff bracket for one division into a podium.
// Winner = current set leader (decided or not); null when tied / no score / no teams.
function computePodium(matches, division) {
    const find = (phase) => matches.find((m) => m.division === division && m.phase === phase);
    const winnerLoser = (m) => {
        if (!m || !m.team_a || !m.team_b) return { winner: null, loser: null };
        const r = resultOf(m.sets);
        if (r.wonA === r.wonB) return { winner: null, loser: null };
        return r.wonA > r.wonB
            ? { winner: m.team_a.trim(), loser: m.team_b.trim() }
            : { winner: m.team_b.trim(), loser: m.team_a.trim() };
    };
    const f = winnerLoser(find("final"));
    const t = winnerLoser(find("third_place"));
    return { champion: f.winner, runnerUp: f.loser, third: t.winner };
}

const ratioStr = (num, den) => (den === 0 ? (num > 0 ? "—" : "0.00") : (num / den).toFixed(2));

function padSets(sets) {
    const arr = Array.isArray(sets) ? sets : [];
    const out = [];
    for (let i = 0; i < 3; i++) {
        const p = arr[i];
        out.push([
            p && p[0] != null ? String(p[0]) : "",
            p && p[1] != null ? String(p[1]) : "",
        ]);
    }
    return out;
}

// ── component ────────────────────────────────────────────────────────────────
export function ScheduleView({ isAdmin }) {
    const { matches, loading, updateMatch } = useMatches();
    const [filter, setFilter] = useState("all"); // all | A | B | table
    const [drafts, setDrafts] = useState({});

    const currentDraft = (m) =>
        drafts[m.id] || {
            team_a: m.team_a ?? "",
            team_b: m.team_b ?? "",
            sets: padSets(m.sets),
        };

    const parseDraftSets = (cur) => {
        const pairs = [];
        cur.sets.forEach((p) => {
            const a = p[0] === "" ? null : parseInt(p[0], 10);
            const b = p[1] === "" ? null : parseInt(p[1], 10);
            if (a === null && b === null) return;
            pairs.push([a ?? 0, b ?? 0]);
        });
        return pairs;
    };

    const effPairs = (m) =>
        isAdmin && drafts[m.id] ? parseDraftSets(currentDraft(m)) : (Array.isArray(m.sets) ? m.sets : []);

    const setName = (m, field, value) =>
        setDrafts((d) => ({ ...d, [m.id]: { ...currentDraft(m), [field]: value } }));

    const setScore = (m, idx, side, value) => {
        const cur = currentDraft(m);
        const sets = cur.sets.map((p) => [...p]);
        sets[idx][side] = value.replace(/[^0-9]/g, "").slice(0, 2);
        setDrafts((d) => ({ ...d, [m.id]: { ...cur, sets } }));
    };

    const commit = (m) => {
        const cur = currentDraft(m);
        updateMatch(m.id, {
            team_a: cur.team_a.trim() === "" ? null : cur.team_a.trim(),
            team_b: cur.team_b.trim() === "" ? null : cur.team_b.trim(),
            sets: parseDraftSets(cur),
        });
    };

    const shiftSlot = (games, delta) =>
        games.forEach((g) =>
            updateMatch(g.id, { start_minute: Math.max(0, Math.min(1439, g.start_minute + delta)) })
        );

    const groups = useMemo(() => {
        const by = new Map();
        matches.forEach((m) => {
            if (!by.has(m.slot_index)) by.set(m.slot_index, []);
            by.get(m.slot_index).push(m);
        });
        return [...by.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([slot, games]) => ({ slot, games }));
    }, [matches]);

    const mensStandings = useMemo(() => computeStandings(matches, "mens"), [matches]);
    const womensStandings = useMemo(() => computeStandings(matches, "womens"), [matches]);
    const mensPodium = useMemo(() => computePodium(matches, "mens"), [matches]);
    const womensPodium = useMemo(() => computePodium(matches, "womens"), [matches]);

    if (loading) return <LoadingState />;

    return (
        <div>
            <FilterBar filter={filter} setFilter={setFilter} />

            {matches.length === 0 ? (
                <EmptyState message="The schedule will be posted here once it's set." />
            ) : filter === "table" ? (
                <div className="space-y-10 sm:space-y-12">
                    <ResultsPanel mens={mensPodium} womens={womensPodium} />
                    <StandingsTable title="Men's Standings" rows={mensStandings} />
                    <StandingsTable title="Women's Standings" rows={womensStandings} />
                </div>
            ) : (
                <div className="space-y-8">
                    {groups.map(({ slot, games }) => {
                        const shown = games.filter((g) => filter === "all" || g.court === filter);
                        if (shown.length === 0) return null;
                        return (
                            <section key={slot}>
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <span className="text-[11px] uppercase tracking-[0.22em] font-bold" style={{ color: C.inkSoft }}>
                                        {slotLabel(games[0])} — {fmtTime(games[0].start_minute)}
                                    </span>
                                    {isAdmin && (
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => shiftSlot(games, -15)} className="p-1 border transition-transform active:scale-90 active:opacity-60" style={{ borderColor: C.ink, color: C.ink }} aria-label="15 minutes earlier">
                                                <Minus size={13} />
                                            </button>
                                            <button onClick={() => shiftSlot(games, 15)} className="p-1 border transition-transform active:scale-90 active:opacity-60" style={{ borderColor: C.ink, color: C.ink }} aria-label="15 minutes later">
                                                <Plus size={13} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {shown.map((m) => (
                                        <GameCard
                                            key={m.id}
                                            m={m}
                                            isAdmin={isAdmin}
                                            pairs={effPairs(m)}
                                            draft={currentDraft(m)}
                                            onName={setName}
                                            onScore={setScore}
                                            onCommit={commit}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function FilterBar({ filter, setFilter }) {
    const opts = [
        ["all", "All"],
        ["A", "Men"],
        ["B", "Women"],
        ["table", "Table"],
    ];
    return (
        <div className="flex border mb-8" style={{ borderColor: C.ink }}>
            {opts.map(([val, label], i) => {
                const on = filter === val;
                return (
                    <button
                        key={val}
                        onClick={() => setFilter(val)}
                        className="flex-1 py-2 text-[11px] sm:text-xs uppercase tracking-widest transition-colors"
                        style={{
                            background: on ? C.rust : "transparent",
                            color: on ? C.cream : C.inkSoft,
                            fontWeight: 700,
                            borderLeft: i === 0 ? "none" : `1px solid ${C.ink}`,
                        }}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

function GameCard({ m, isAdmin, pairs, draft, onName, onScore, onCommit }) {
    const [saved, setSaved] = useState(false);
    const teamA = isAdmin ? draft.team_a : m.team_a;
    const teamB = isAdmin ? draft.team_b : m.team_b;
    const r = resultOf(pairs);
    const status = statusOf(teamA, teamB, pairs);
    const badge = STATUS[status];
    const played = pairs.length > 0;
    const aWin = r.wonA > r.wonB;
    const bWin = r.wonB > r.wonA;

    const handleSubmit = () => {
        onCommit(m);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    // One score cell per set for the given side (0 = team A, 1 = team B).
    // The set winner is tinted rust; columns line up across both team rows.
    const renderSets = (side) =>
        played ? (
            <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
                {pairs.map((p, i) => {
                    const mine = Number(p[side]) || 0;
                    const other = Number(p[side === 0 ? 1 : 0]) || 0;
                    return (
                        <span key={i} className="text-center"
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 22,
                                width: 22,
                                color: mine > other ? C.rust : C.inkSoft,
                            }}>
                            {mine}
                        </span>
                    );
                })}
            </div>
        ) : null;

    return (
        <article className="border p-4 sm:p-5" style={{ borderColor: C.ink, background: C.paper }}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] font-bold" style={{ color: C.rust }}>
                    {cardLabel(m)}
                </span>
                <span className="text-[11px] uppercase tracking-wider font-bold px-2 py-0.5"
                    style={{ background: badge.bg, color: badge.fg }}>
                    {badge.label}
                </span>
            </div>

            <div className="flex items-center gap-3 mt-3">
                {isAdmin ? (
                    <input
                        value={draft.team_a}
                        onChange={(e) => onName(m, "team_a", e.target.value)}
                        placeholder="Team A"
                        className="flex-1 bg-transparent focus:outline-none border-b"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.ink, borderColor: C.line }}
                    />
                ) : (
                    <>
                        <span className="flex-1 truncate" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: aWin ? C.rust : C.ink }}>
                            {teamA || "TBD"}
                        </span>
                        {renderSets(0)}
                    </>
                )}
                <span style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: C.ink,
                    minWidth: 18, textAlign: "center",
                    borderLeft: !isAdmin && played ? `1px solid ${C.line}` : "none",
                    paddingLeft: !isAdmin && played ? 12 : 0,
                }}>
                    {played ? r.wonA : "–"}
                </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
                {isAdmin ? (
                    <input
                        value={draft.team_b}
                        onChange={(e) => onName(m, "team_b", e.target.value)}
                        placeholder="Team B"
                        className="flex-1 bg-transparent focus:outline-none border-b"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.ink, borderColor: C.line }}
                    />
                ) : (
                    <>
                        <span className="flex-1 truncate" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: bWin ? C.rust : C.ink }}>
                            {teamB || "TBD"}
                        </span>
                        {renderSets(1)}
                    </>
                )}
                <span style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: C.ink,
                    minWidth: 18, textAlign: "center",
                    borderLeft: !isAdmin && played ? `1px solid ${C.line}` : "none",
                    paddingLeft: !isAdmin && played ? 12 : 0,
                }}>
                    {played ? r.wonB : "–"}
                </span>
            </div>

            {isAdmin && (
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px dashed ${C.line}` }}>
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] uppercase tracking-wider" style={{ color: C.inkSoft }}>
                            <span className="w-12">Set {i + 1}</span>
                            <input
                                value={draft.sets[i][0]}
                                onChange={(e) => onScore(m, i, 0, e.target.value)}
                                inputMode="numeric"
                                className="w-12 px-2 py-1.5 border bg-white text-center focus:outline-none"
                                style={{ borderColor: C.ink, color: C.ink, fontSize: 13 }}
                            />
                            <span style={{ color: C.ink }}>–</span>
                            <input
                                value={draft.sets[i][1]}
                                onChange={(e) => onScore(m, i, 1, e.target.value)}
                                inputMode="numeric"
                                className="w-12 px-2 py-1.5 border bg-white text-center focus:outline-none"
                                style={{ borderColor: C.ink, color: C.ink, fontSize: 13 }}
                            />
                        </div>
                    ))}
                    <button
                        onClick={handleSubmit}
                        className="mt-2 w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs uppercase tracking-widest transition-transform active:scale-[0.98]"
                        style={{ background: saved ? C.ok : C.ink, color: C.cream, fontWeight: 700, letterSpacing: "0.15em" }}
                    >
                        {saved ? <><Check size={14} /> Saved</> : "Submit"}
                    </button>
                </div>
            )}
        </article>
    );
}

function ResultsPanel({ mens, womens }) {
    const has = (p) => p.champion || p.runnerUp || p.third;
    // Stay hidden until the playoffs start producing results.
    if (!has(mens) && !has(womens)) return null;
    return (
        <section>
            <div className="flex items-baseline justify-between border-b-2 pb-2 mb-4" style={{ borderColor: C.ink }}>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 7vw, 44px)", lineHeight: 1, color: C.ink, letterSpacing: "0.02em" }}>
                    Final Results
                </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <Podium title="Men's" podium={mens} />
                <Podium title="Women's" podium={womens} />
            </div>
        </section>
    );
}

function Podium({ title, podium }) {
    const rows = [
        { label: "Champion", name: podium.champion, accent: C.gold, bg: C.goldBg },
        { label: "Runner-Up", name: podium.runnerUp, accent: C.inkSoft, bg: C.paper },
        { label: "Third Place", name: podium.third, accent: C.rust, bg: C.paper },
    ];
    return (
        <div className="border" style={{ borderColor: C.ink }}>
            <div className="px-3 py-2 text-[11px] uppercase tracking-widest font-bold" style={{ background: C.ink, color: C.cream }}>
                {title} Division
            </div>
            {rows.map((r, i) => (
                <div key={r.label} className="flex items-center gap-3 px-3 py-2.5"
                    style={{ background: r.bg, borderTop: i ? `1px solid ${C.line}` : "none" }}>
                    <span className="text-[10px] uppercase tracking-wider font-bold w-[5.5rem] shrink-0" style={{ color: r.accent }}>
                        {r.label}
                    </span>
                    <span className="flex-1 truncate" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: r.name ? C.ink : C.inkSoft }}>
                        {r.name || "TBD"}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StandingsTable({ title, rows }) {
    return (
        <section>
            <div className="flex items-baseline justify-between border-b-2 pb-2 mb-4" style={{ borderColor: C.ink }}>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 7vw, 44px)", lineHeight: 1, color: C.ink, letterSpacing: "0.02em" }}>
                    {title}
                </h2>
            </div>

            {rows.length === 0 ? (
                <EmptyState message="No scores entered yet." />
            ) : (
                <div className="border" style={{ borderColor: C.ink }}>
                    <div className="grid items-center text-[10px] sm:text-[11px] uppercase tracking-wider font-bold"
                        style={{ gridTemplateColumns: "1.5rem 1fr 1.6rem 1.6rem 1.6rem 2.8rem 3.4rem", background: C.ink, color: C.cream }}>
                        <Cell>#</Cell>
                        <Cell left>Team</Cell>
                        <Cell>P</Cell>
                        <Cell>W</Cell>
                        <Cell>L</Cell>
                        <Cell>Sets</Cell>
                        <Cell>PTS Ratio</Cell>
                    </div>
                    {rows.map((t, i) => (
                        <div key={t.name} className="grid items-center text-xs sm:text-sm"
                            style={{
                                gridTemplateColumns: "1.5rem 1fr 1.6rem 1.6rem 1.6rem 2.8rem 3.4rem",
                                background: i % 2 ? C.cream : C.paper,
                                color: C.ink,
                                borderTop: `1px solid ${C.line}`,
                            }}>
                            <Cell><span style={{ color: i === 0 ? C.gold : C.inkSoft, fontWeight: 700 }}>{i + 1}</span></Cell>
                            <Cell left>
                                <span className="truncate block" style={{ fontWeight: 600 }}>{t.name}</span>
                            </Cell>
                            <Cell>{t.p}</Cell>
                            <Cell>{t.w}</Cell>
                            <Cell>{t.l}</Cell>
                            <Cell>{t.sw}–{t.sl}</Cell>
                            <Cell>{ratioStr(t.pf, t.pa)}</Cell>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function Cell({ children, left }) {
    return (
        <div className="px-1.5 py-2 overflow-hidden" style={{ textAlign: left ? "left" : "center" }}>
            {children}
        </div>
    );
}