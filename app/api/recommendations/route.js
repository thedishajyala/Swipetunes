import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTopTracks, getRecommendations } from "@/lib/spotify";

const FALLBACK_TRACKS = [
    {
        track_id: "0VjIjW4GlUZAMYd2vXMi3b",
        title: "Blinding Lights",
        artist: "The Weeknd",
        album: "After Hours",
        cover_url: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
        preview_url: "https://p.scdn.co/mp3-preview/bf41b83df88f57564d7010476a8820be459a96e8?cid=cfe923b2d660439caf2b557b21f31221",
        color: '#ff0000'
    },
    {
        track_id: "21jGcNKet2qwijl0efuYtR",
        title: "Levitating",
        artist: "Dua Lipa",
        album: "Future Nostalgia",
        cover_url: "https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946",
        preview_url: null,
        color: '#2d2d2d'
    }
];

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch seeds (Limit 50 for better variety)
        let seedTrackIds = [];
        try {
            const topTracksData = await getTopTracks(session.accessToken, 'short_term', 50);
            seedTrackIds = topTracksData.items?.map(t => t.id) || [];
        } catch (err) {
            console.warn("Recs API: Spotify fetch failed (Top Tracks).");
        }

        // 2. Get recommendations (Limit 50)
        let recs = [];
        try {
            const seeds = seedTrackIds.length > 0 ? seedTrackIds.slice(0, 5) : ['4iJyoBOLtHqaGxP12qzhQI'];
            // Requesting 50 recommendations to allow for heavy filtering
            recs = await getRecommendations(session.accessToken, seeds, { limit: 50 });
        } catch (spotifyErr) {
            console.error("Recs API: Spotify Recommendations failed:", spotifyErr.message);
            return NextResponse.json(FALLBACK_TRACKS);
        }

        // 3. Strict Filtering: MUST Have Preview URL
        const tracks = (recs || [])
            .filter(track => track && track.preview_url) // CRITICAL: Only tracks with audio
            .map(track => ({
                track_id: track.id,
                title: track.name || "Unknown Track",
                artist: track.artists?.map(a => a.name).join(', ') || "Unknown Artist",
                album: track.album?.name || "Unknown Album",
                cover_url: track.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format",
                preview_url: track.preview_url,
                color: '#1DB954'
            }));

        // 4. Update catalog safely (in background if possible, or await)
        if (tracks.length > 0 && supabaseAdmin) {
            try {
                await supabaseAdmin
                    .from('songs')
                    .upsert(
                        tracks.map(t => ({
                            track_id: t.track_id,
                            title: t.title,
                            artist: t.artist,
                            album: t.album,
                            cover_url: t.cover_url
                        })),
                        { onConflict: 'track_id' }
                    );
            } catch (catalogErr) {
                // Silent fail for catalog sync
            }
        }

        // Return filtered tracks. If we filtered everything away (unlikely with 50 limit), return fallback.
        if (tracks.length === 0) return NextResponse.json(FALLBACK_TRACKS);

        return NextResponse.json(tracks);
    } catch (err) {
        console.error('Recs API Critical Failure:', err);
        return NextResponse.json(FALLBACK_TRACKS);
    }
}
