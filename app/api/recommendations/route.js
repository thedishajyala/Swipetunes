import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTopTracks, getRecommendations } from "@/lib/spotify";
import { FALLBACK_CATALOG } from "@/lib/fallback-catalog";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch seeds (Limit 50)
        let seedTrackIds = [];
        try {
            const topTracksData = await getTopTracks(session.accessToken, 'short_term', 50);
            seedTrackIds = topTracksData.items?.map(t => t.id) || [];
        } catch (err) {
            console.warn("Recs API: Spotify fetch failed (Top Tracks).");
        }

        // 2. Get recommendations (Limit 100 for maximum yield)
        let recs = [];
        try {
            const seeds = seedTrackIds.length > 0 ? seedTrackIds.slice(0, 5) : ['4iJyoBOLtHqaGxP12qzhQI'];
            // Request 100 to increase odds of finding preview_urls
            recs = await getRecommendations(session.accessToken, seeds, { limit: 100 });
        } catch (spotifyErr) {
            console.error("Recs API: Spotify Recommendations failed:", spotifyErr.message);
            // On error, we rely on fallbacks
        }

        // 3. Strict Filtering: MUST Have Preview URL
        let tracks = (recs || [])
            .filter(track => track && track.preview_url)
            .map(track => ({
                track_id: track.id,
                title: track.name || "Unknown Track",
                artist: track.artists?.map(a => a.name).join(', ') || "Unknown Artist",
                album: track.album?.name || "Unknown Album",
                cover_url: track.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format",
                preview_url: track.preview_url,
                color: '#1DB954'
            }));

        // 4. HYBRID FILLER: If tracks < 10, fill with Curated Catalog
        // Identify which fallbacks are not already in tacks
        if (tracks.length < 10) {
            const currentIds = new Set(tracks.map(t => t.track_id));
            const needed = 10 - tracks.length;

            const fillers = FALLBACK_CATALOG.filter(kt => !currentIds.has(kt.track_id));

            // Randomly shuffle fillers to vary experience if possible, but simplest is just concat
            tracks = [...tracks, ...fillers];
        }

        // 5. Update catalog safely
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

        // 6. Deduplicate just in case
        const seen = new Set();
        const uniqueTracks = [];
        for (const t of tracks) {
            if (!seen.has(t.track_id)) {
                seen.add(t.track_id);
                uniqueTracks.push(t);
            }
        }

        return NextResponse.json(uniqueTracks);
    } catch (err) {
        console.error('Recs API Critical Failure:', err);
        // Absolute fail-safe
        return NextResponse.json(FALLBACK_CATALOG);
    }
}
