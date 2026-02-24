import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get("userId");
    if (!otherUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const myId = session.user.id;

    try {
        // Fetch liked songs for both users
        const [myRes, theirRes] = await Promise.all([
            supabaseAdmin.from("likes").select("song_id, songs(artist)").eq("user_id", myId),
            supabaseAdmin.from("likes").select("song_id, songs(artist)").eq("user_id", otherUserId),
        ]);

        const mySongs = new Set((myRes.data || []).map(r => r.song_id));
        const theirSongs = new Set((theirRes.data || []).map(r => r.song_id));

        const myArtists = new Set((myRes.data || []).map(r => r.songs?.artist).filter(Boolean));
        const theirArtists = new Set((theirRes.data || []).map(r => r.songs?.artist).filter(Boolean));

        // Shared songs
        const sharedSongs = [...mySongs].filter(id => theirSongs.has(id));
        // Shared artists
        const sharedArtists = [...myArtists].filter(a => theirArtists.has(a));

        // Score: weighted combo — songs count more
        const songScore = mySongs.size + theirSongs.size > 0
            ? (2 * sharedSongs.length) / (mySongs.size + theirSongs.size) : 0;
        const artistScore = myArtists.size + theirArtists.size > 0
            ? (2 * sharedArtists.length) / (myArtists.size + theirArtists.size) : 0;

        const matchPct = Math.min(100, Math.round((songScore * 0.6 + artistScore * 0.4) * 100));

        // Label
        let label, emoji;
        if (matchPct >= 80) { label = "Music Soulmates"; emoji = "💚"; }
        else if (matchPct >= 60) { label = "Serious Overlap"; emoji = "🔥"; }
        else if (matchPct >= 40) { label = "Good Vibes Match"; emoji = "🎵"; }
        else if (matchPct >= 20) { label = "A Little Alike"; emoji = "👀"; }
        else { label = "Opposite Worlds"; emoji = "🌍"; }

        return NextResponse.json({
            matchPct,
            label,
            emoji,
            sharedSongs: sharedSongs.length,
            sharedArtists,
            myTotal: mySongs.size,
            theirTotal: theirSongs.size,
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
