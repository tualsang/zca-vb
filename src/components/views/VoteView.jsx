import { useState, useMemo } from "react";
import { Check, X, Plus, Minus, Vote as VoteIcon, Loader2 } from "lucide-react";
import { C } from "../../lib/constants";
import { LoadingState, EmptyState } from "../shared/Status";
import { useMvp } from "../../hooks/useMvp.js";
import { useMatches } from "../../hooks/useMatches";

const norm = (s) => (s || "").trim().toLowerCase();
const keyOf = (playerName, team) => `${norm(playerName)}|${norm(team)}`;


function readVoted() {
    try { return typeof window !== "undefined" && window.localStorage.getItem("zca_mvp_voted") === "1"; }
    catch { return false; }
}
function getToken() {
    try {
        let t = window.localStorage.getItem("zca_mvp_token");
        if (!t) {
            t = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : String(Math.random()).slice(2);
            window.localStorage.setItem("zca_mvp_token", t);
        }
        return t;
    } catch { return null; }
}

export function VoteView({ isAdmin }) {
    const { votes, loading, castVote, approveVote, deleteVote } = useMvp();
    const { matches } = useMatches();

    const [voted, setVoted] = useState(readVoted);
    const [name, setName] = useState("");
    const [team, setTeam] = useState("");
    const [error, setError] = useState("");
    const [thanks, setThanks] = useState("");
    const [busy, setBusy] = useState(false);

    const markVoted = () => {
        try { window.localStorage.setItem("zca_mvp_voted", "1"); } catch { /* ignore */ }
        setVoted(true);
    };

    // Men's team names, trimmed and de-duplicated (case-insensitive).
    const teams = useMemo(() => {
        const seen = new Map();
        matches.filter((m) => m.division === "mens").forEach((m) => {
            [m.team_a, m.team_b].forEach((n) => {
                if (n && n.trim()) {
                    const k = norm(n);
                    if (!seen.has(k)) seen.set(k, n.trim());
                }
            });
        });
        return [...seen.values()].sort((a, b) => a.localeCompare(b));
    }, [matches]);

    // Approved votes grouped into candidates with percentages.
    // Rows inserted by admin with voter_token "admin-seed" establish a candidate
    // entry (count = 0) without contributing to the vote tally, so all players
    // start at 0% until a real visitor casts a vote.
    const poll = useMemo(() => {
        const map = new Map();
        votes.filter((v) => v.status === "approved").forEach((v) => {
            const k = keyOf(v.player_name, v.team);
            const isSeed = v.voter_token === "admin-seed";
            if (!map.has(k)) map.set(k, { key: k, player_name: v.player_name.trim(), team: v.team.trim(), count: 0 });
            if (!isSeed) map.get(k).count++;
        });
        const arr = [...map.values()];
        const total = arr.reduce((s, c) => s + c.count, 0);
        arr.forEach((c) => { c.pct = total ? Math.round((c.count / total) * 100) : 0; });
        arr.sort((a, b) => b.count - a.count || a.player_name.localeCompare(b.player_name));
        return { arr, total };
    }, [votes]);

    const pending = useMemo(() => votes.filter((v) => v.status === "pending"), [votes]);

    const tapVote = async (c) => {
        if (voted || busy) return;
        setBusy(true);
        const ok = await castVote({ player_name: c.player_name, team: c.team, voter_token: getToken(), status: "approved" });
        if (ok) { markVoted(); setThanks(`Your vote for ${c.player_name} is in.`); }
        setBusy(false);
    };

    const submitWriteIn = async () => {
        setError("");
        if (!name.trim()) return setError("Enter the player's name.");
        if (!team) return setError("Choose a team.");
        setBusy(true);
        const ok = await castVote({ player_name: name.trim(), team, voter_token: getToken(), status: "pending" });
        if (ok) {
            markVoted();
            setThanks("Thanks! Your write-in will appear once an organizer approves it.");
            setName(""); setTeam("");
        }
        setBusy(false);
    };

    const adminAdd = async () => {
        setError("");
        if (!name.trim()) return setError("Enter the player's name.");
        if (!team) return setError("Choose a team.");
        setBusy(true);
        // Use voter_token "admin-seed" so this row registers the player without
        // counting as a real vote (count stays at 0 until a visitor votes).
        await castVote({ player_name: name.trim(), team, voter_token: "admin-seed", status: "approved" });
        setName(""); setTeam("");
        setBusy(false);
    };

    const adminBump = (c) =>
        castVote({ player_name: c.player_name, team: c.team, voter_token: null, status: "approved" });

    const adminRemoveOne = (c) => {
        const row = votes.find((v) => v.status === "approved" && keyOf(v.player_name, v.team) === c.key);
        if (row) deleteVote(row.id);
    };

    if (loading) return <LoadingState />;

    const showCastForm = isAdmin || !voted;

    return (
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
            <aside className="lg:col-span-3">
                <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: C.rust, fontWeight: 700 }}>
                    Most Valuable Player
                </div>
                <h2 className="leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(40px, 10vw, 56px)", color: C.ink }}>
                    MVP Vote
                </h2>
                <p className="mt-3 text-sm italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
                    Vote for the men's-division player who stood out. Tap a name below, or write in someone who isn't listed.
                </p>
                {thanks && (
                    <div className="mt-4 p-3 text-xs flex items-center gap-2" style={{ background: C.okBg, color: C.ok, border: `1px solid ${C.ok}` }}>
                        <Check size={14} /> {thanks}
                    </div>
                )}
            </aside>

            <section className="lg:col-span-9 space-y-8">
                {/* ── Live poll ─────────────────────────────────────────────── */}
                <div>
                    <div className="flex items-baseline justify-between border-b-2 pb-2 mb-4" style={{ borderColor: C.ink }}>
                        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(24px, 6vw, 34px)", lineHeight: 1, color: C.ink, letterSpacing: "0.02em" }}>
                            Results
                        </h3>
                        {isAdmin && (
                            <span className="text-xs uppercase tracking-widest" style={{ color: C.inkSoft }}>
                                {poll.total} {poll.total === 1 ? "vote" : "votes"}
                            </span>
                        )}
                    </div>

                    {poll.arr.length === 0 ? (
                        <EmptyState message="No votes yet. Be the first to vote!" />
                    ) : (
                        <div className="space-y-3">
                            {poll.arr.map((c) => (
                                <div key={c.key} className="border p-3 sm:p-4" style={{ borderColor: C.ink, background: C.paper }}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.ink, letterSpacing: "0.02em" }}>
                                                {c.player_name}
                                            </div>
                                            <div className="text-[11px] uppercase tracking-widest truncate" style={{ color: C.inkSoft }}>
                                                {c.team}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: C.rust }}>{c.pct}%</span>
                                            {!isAdmin && !voted && (
                                                <button onClick={() => tapVote(c)} disabled={busy}
                                                    className="px-3 py-2 text-[11px] uppercase tracking-widest disabled:opacity-50"
                                                    style={{ background: C.ink, color: C.cream, fontWeight: 700 }}>
                                                    Vote
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => adminRemoveOne(c)} className="p-1.5 border transition-transform active:scale-90" style={{ borderColor: C.ink, color: C.ink }} aria-label="Remove one vote">
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-6 text-center text-sm" style={{ color: C.inkSoft }}>{c.count}</span>
                                                    <button onClick={() => adminBump(c)} className="p-1.5 border transition-transform active:scale-90" style={{ borderColor: C.ink, color: C.ink }} aria-label="Add one vote">
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Cast / write-in / admin add ───────────────────────────── */}
                {showCastForm ? (
                    <div className="border p-5 sm:p-6" style={{ borderColor: C.ink, background: C.paper }}>
                        <div className="text-[10px] uppercase tracking-[0.25em] mb-3 font-bold" style={{ color: C.rust }}>
                            {isAdmin ? "Admin · Add a vote" : "Don't see your player? Write them in"}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>Player name</label>
                                <input value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Sam Okonkwo"
                                    className="w-full px-3 py-2 border bg-transparent focus:outline-none text-sm"
                                    style={{ borderColor: C.ink, color: C.ink }} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>Team</label>
                                <select value={team} onChange={(e) => setTeam(e.target.value)}
                                    className="w-full px-3 py-2 border bg-transparent focus:outline-none text-sm"
                                    style={{ borderColor: C.ink, color: team ? C.ink : C.inkSoft }}>
                                    <option value="">{teams.length ? "— Select a team —" : "No teams yet"}</option>
                                    {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        {error && (
                            <div className="mt-3 px-3 py-2 text-sm" style={{ background: "#FBE3DB", color: C.rustDark, border: `1px solid ${C.rust}` }}>
                                {error}
                            </div>
                        )}
                        <button onClick={isAdmin ? adminAdd : submitWriteIn} disabled={busy}
                            className="mt-4 inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-60"
                            style={{ background: C.rust, color: C.cream, fontWeight: 700, letterSpacing: "0.15em" }}>
                            {busy ? <><Loader2 size={14} className="animate-spin" /> Working…</>
                                : isAdmin ? <><Plus size={14} /> Add Vote</>
                                    : <><VoteIcon size={14} /> Cast Your Vote</>}
                        </button>
                        {!isAdmin && (
                            <p className="mt-2 text-[11px] italic" style={{ color: C.inkSoft, fontFamily: "'Newsreader', serif" }}>
                                New names are reviewed by an organizer before they appear in the results.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="border p-4 text-sm flex items-center gap-2" style={{ borderColor: C.ok, background: C.okBg, color: C.ok }}>
                        <Check size={16} /> Your vote is in — thanks! Results update live above.
                    </div>
                )}

                {/* ── Admin: pending write-ins ──────────────────────────────── */}
                {isAdmin && (
                    <div className="border-2 border-dashed p-4 sm:p-5" style={{ borderColor: C.ink, background: C.paper }}>
                        <div className="text-[10px] uppercase tracking-[0.25em] mb-3 font-bold" style={{ color: C.rust }}>
                            Admin · Pending write-ins ({pending.length})
                        </div>
                        {pending.length === 0 ? (
                            <p className="text-sm italic" style={{ color: C.inkSoft, fontFamily: "'Newsreader', serif" }}>
                                No write-ins waiting. Approving one adds it to the poll; if that name already exists on that team, it adds a vote to the existing tally.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {pending.map((v) => (
                                    <div key={v.id} className="flex items-center justify-between gap-3 border p-3" style={{ borderColor: C.line, background: C.cream }}>
                                        <div className="min-w-0">
                                            <div className="truncate" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: C.ink }}>{v.player_name}</div>
                                            <div className="text-[11px] uppercase tracking-widest truncate" style={{ color: C.inkSoft }}>{v.team}</div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => approveVote(v.id)} className="inline-flex items-center gap-1 px-3 py-2 text-[11px] uppercase tracking-widest" style={{ background: C.ink, color: C.cream, fontWeight: 700 }}>
                                                <Check size={13} /> Approve
                                            </button>
                                            <button onClick={() => deleteVote(v.id)} className="p-2 border" style={{ borderColor: C.ink, color: C.rust }} aria-label="Reject write-in">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}