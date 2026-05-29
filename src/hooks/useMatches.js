import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// Loads all matches, keeps them fresh via Realtime, and exposes a single
// updateMatch(id, patch) for admin edits. Mirrors the registrations pattern
// in App.jsx, but scoped to the schedule feature so App.jsx stays lean.
export function useMatches() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        const { data, error } = await supabase
            .from("matches")
            .select("*")
            .order("slot_index", { ascending: true })
            .order("court", { ascending: true });
        if (error) console.error("Matches load error:", error);
        else setMatches(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
        const channel = supabase
            .channel("matches-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "matches" },
                () => load()
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [load]);

    const updateMatch = useCallback(async (id, patch) => {
        // Optimistic: apply locally first so the admin sees it immediately,
        // regardless of realtime latency or whether replication is enabled.
        setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
        const { error } = await supabase.from("matches").update(patch).eq("id", id);
        if (error) {
            alert("Could not save: " + error.message);
            load(); // revert to the server's truth on failure
        }
    }, [load]);

    return { matches, loading, updateMatch };
}