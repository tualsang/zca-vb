import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// Loads MVP votes and keeps them fresh via Realtime. For the public, RLS
// returns only approved rows; for the admin it returns everything (including
// the pending write-in queue).
export function useMvp() {
    const [votes, setVotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        const { data, error } = await supabase
            .from("mvp_votes")
            .select("*")
            .order("created_at", { ascending: true });
        if (error) console.error("MVP load error:", error);
        else setVotes(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
        const channel = supabase
            .channel("mvp-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "mvp_votes" },
                () => load()
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [load]);

    // row: { player_name, team, voter_token, status }
    const castVote = useCallback(async (row) => {
        const { error } = await supabase.from("mvp_votes").insert([row]);
        if (error) { alert("Could not submit your vote: " + error.message); return false; }
        return true;
    }, []);

    const approveVote = useCallback(async (id) => {
        const { error } = await supabase.from("mvp_votes").update({ status: "approved" }).eq("id", id);
        if (error) alert("Could not approve: " + error.message);
    }, []);

    const deleteVote = useCallback(async (id) => {
        const { error } = await supabase.from("mvp_votes").delete().eq("id", id);
        if (error) alert("Could not remove: " + error.message);
    }, []);

    return { votes, loading, castVote, approveVote, deleteVote };
}