import { useState, useMemo } from "react";
import { Minus, Plus } from "lucide-react";
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
    matches
        .filter((m) => m.division === division && m.phase === "round_robin")
        .forEach((m) => {
            const r = resultOf(m.sets);
            if (!r.decided || !m.team_a || !m.team_b) return;
            const ka = norm(m.team_a), kb = norm(m.team_b);
            ensure(ka, m.team_a.trim()); ensure(kb, m.team_b.trim());
            const A = rows[ka], B = rows[kb];
            A.p++; B.p++;
            if (r.wonA > r.wonB) { A.w++; B.l++; } else { B.w++; A.l++; }
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

    const shiftTime = (m, delta) =>
        updateMatch(m.id, { start_minute: Math.max(0, Math.min(1439, m.start_minute + delta)) });

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

    if (loading) return <LoadingState />;

    return (
        <div>
            <FilterBar filter={filter} setFilter={setFilter} />

            {matches.length === 0 ? (
                <EmptyState message="The schedule will be posted here once it's set." />
            ) : filter === "table" ? (
                <div className="space-y-10 sm:space-y-12">
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
                                <div className="text-[11px] uppercase tracking-[0.25em] mb-3 font-bold" style={{ color: C.inkSoft }}>
                                    {slotLabel(games[0])}
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
                                            onShift={shiftTime}
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

function GameCard({ m, isAdmin, pairs, draft, onName, onScore, onCommit, onShift }) {
    const teamA = isAdmin ? draft.team_a : m.team_a;
    const teamB = isAdmin ? draft.team_b : m.team_b;
    const r = resultOf(pairs);
    const status = statusOf(teamA, teamB, pairs);
    const badge = STATUS[status];
    const played = pairs.length > 0;
    const aWin = r.wonA > r.wonB;
    const bWin = r.wonB > r.wonA;

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

            <div className="flex items-center justify-between gap-3 mt-3">
                {isAdmin ? (
                    <input
                        value={draft.team_a}
                        onChange={(e) => onName(m, "team_a", e.target.value)}
                        onBlur={() => onCommit(m)}
                        placeholder="Team A"
                        className="flex-1 bg-transparent focus:outline-none border-b"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.ink, borderColor: C.line }}
                    />
                ) : (
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: aWin ? C.rust : C.ink }}>
                        {teamA || "TBD"}
                    </span>
                )}
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: C.ink, minWidth: 18, textAlign: "center" }}>
                    {played ? r.wonA : "–"}
                </span>
            </div>

            <div className="flex items-center justify-between gap-3 mt-1">
                {isAdmin ? (
                    <input
                        value={draft.team_b}
                        onChange={(e) => onName(m, "team_b", e.target.value)}
                        onBlur={() => onCommit(m)}
                        placeholder="Team B"
                        className="flex-1 bg-transparent focus:outline-none border-b"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.ink, borderColor: C.line }}
                    />
                ) : (
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: bWin ? C.rust : C.ink }}>
                        {teamB || "TBD"}
                    </span>
                )}
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: C.ink, minWidth: 18, textAlign: "center" }}>
                    {played ? r.wonB : "–"}
                </span>
            </div>

            {!isAdmin && played && (
                <div className="mt-3 text-[11px]" style={{ color: C.inkSoft, letterSpacing: "0.04em" }}>
                    {pairs.map((p, i) => `${p[0]}–${p[1]}`).join("  ·  ")}
                </div>
            )}

            <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: `1px dashed ${C.line}` }}>
                {isAdmin && (
                    <button onClick={() => onShift(m, -15)} className="p-1 border" style={{ borderColor: C.ink, color: C.ink }} aria-label="15 minutes earlier">
                        <Minus size={14} />
                    </button>
                )}
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: C.ink, letterSpacing: "0.04em" }}>
                    {fmtTime(m.start_minute)}
                </span>
                {isAdmin && (
                    <button onClick={() => onShift(m, 15)} className="p-1 border" style={{ borderColor: C.ink, color: C.ink }} aria-label="15 minutes later">
                        <Plus size={14} />
                    </button>
                )}
            </div>

            {isAdmin && (
                <div className="mt-3 space-y-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] uppercase tracking-wider" style={{ color: C.inkSoft }}>
                            <span className="w-12">Set {i + 1}</span>
                            <input
                                value={draft.sets[i][0]}
                                onChange={(e) => onScore(m, i, 0, e.target.value)}
                                onBlur={() => onCommit(m)}
                                inputMode="numeric"
                                className="w-12 px-2 py-1.5 border bg-white text-center focus:outline-none"
                                style={{ borderColor: C.ink, color: C.ink, fontSize: 13 }}
                            />
                            <span style={{ color: C.ink }}>–</span>
                            <input
                                value={draft.sets[i][1]}
                                onChange={(e) => onScore(m, i, 1, e.target.value)}
                                onBlur={() => onCommit(m)}
                                inputMode="numeric"
                                className="w-12 px-2 py-1.5 border bg-white text-center focus:outline-none"
                                style={{ borderColor: C.ink, color: C.ink, fontSize: 13 }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </article>
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
                <EmptyState message="No completed matches yet." />
            ) : (
                <div className="border" style={{ borderColor: C.ink }}>
                    <div className="grid items-center text-[10px] sm:text-[11px] uppercase tracking-widest font-bold"
                        style={{ gridTemplateColumns: "1.6rem 1fr 1.8rem 1.8rem 3rem 2.6rem 3rem", background: C.ink, color: C.cream }}>
                        <Cell>#</Cell>
                        <Cell left>Team</Cell>
                        <Cell>P</Cell>
                        <Cell>W</Cell>
                        <Cell>Sets</Cell>
                        <Cell>Pts</Cell>
                        <Cell>Ratio</Cell>
                    </div>
                    {rows.map((t, i) => (
                        <div key={t.name} className="grid items-center text-xs sm:text-sm"
                            style={{
                                gridTemplateColumns: "1.6rem 1fr 1.8rem 1.8rem 3rem 2.6rem 3rem",
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
                            <Cell>{t.sw}–{t.sl}</Cell>
                            <Cell>{t.pf}</Cell>
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