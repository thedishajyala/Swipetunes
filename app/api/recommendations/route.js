import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTopTracks, getRecommendations } from "@/lib/spotify";

// SAFETY NET: If Spotify API fails, these tracks will be served.
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
    },
    {
        track_id: "3ZCTVFBt2Brf31RLEnCkWJ",
        title: "everything i wanted",
        artist: "Billie Eilish",
        album: "everything i wanted",
        cover_url: "https://i.scdn.co/image/ab67616d0000b2731d1cc2e40d533d7bcebf5dae",
        preview_url: null,
        color: '#555555'
    }
];

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch seeds
        let seedTrackIds = [];
        try {
            const topTracksData = await getTopTracks(session.accessToken, 'short_term', 5);
            seedTrackIds = topTracksData.items?.map(t => t.id) || [];
        } catch (err) {
            console.warn("Recs API: Spotify fetch failed (Top Tracks).");
        }

        // 2. Get recommendations
        let recs = [];
        try {
            // Using a resilient seed strategy
            const seeds = seedTrackIds.length > 0 ? seedTrackIds.slice(0, 5) : ['4iJyoBOLtHqaGxP12qzhQI'];
            recs = await getRecommendations(session.accessToken, seeds);
        } catch (spotifyErr) {
            console.error("Recs API: Spotify Recommendations failed:", spotifyErr.message);
            // IMMEDIATE FALLBACK on Spotify error
            return NextResponse.json(FALLBACK_TRACKS);
        }

        // 3. Format
        const tracks = (recs || []).map(track => {
            if (!track) return null;
            return {
                track_id: track.id,
                title: track.name || "Unknown Track",
                artist: track.artists?.map(a => a.name).join(', ') || "Unknown Artist",
                album: track.album?.name || "Unknown Album",
                cover_url: track.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format",
                preview_url: track.preview_url || null,
                color: '#1DB954'
            };
        }).filter(Boolean);

        // 4. Update catalog safely
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

        if (tracks.length === 0) return NextResponse.json(FALLBACK_TRACKS);

        return NextResponse.json(tracks);
    } catch (err) {
        console.error('Recs API Critical Failure:', err);
        return NextResponse.json(FALLBACK_TRACKS);
    }
}
