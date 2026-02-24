import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        // Count likes per track_id, join with songs data
        const { data, error } = await supabase
            .from("likes")
            .select("track_id, songs(title, artist, album, cover_url, preview_url)")
            .not("track_id", "is", null);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Aggregate like counts
        const counts = {};
        const meta = {};
        (data || []).forEach(row => {
            const id = row.track_id;
            if (!id) return;
            counts[id] = (counts[id] || 0) + 1;
            if (!meta[id] && row.songs) meta[id] = row.songs;
        });

        // Sort by likes desc, take top 50
        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
            .map(([track_id, like_count], index) => ({
                rank: index + 1,
                track_id,
                like_count,
                ...(meta[track_id] || { title: "Unknown Track", artist: "Unknown Artist", cover_url: null, preview_url: null }),
            }));

        return NextResponse.json(sorted);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
