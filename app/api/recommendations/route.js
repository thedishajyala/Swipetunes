import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTopTracks, getTopArtists, getRecommendations } from "@/lib/spotify";
import { FALLBACK_CATALOG } from "@/lib/fallback-catalog";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Top Tracks (User Favorites) - Limit 50
        let topTracks = [];
        try {
            const topTracksData = await getTopTracks(session.accessToken, 'short_term', 50);
            topTracks = topTracksData.items || [];
        } catch (err) {
            console.warn("Recs API: Spotify Top Tracks fetch failed.", err);
        }

        // 2. Fetch Top Artists (Backup Seeds) - Limit 5
        let topArtists = [];
        try {
            const topArtistsData = await getTopArtists(session.accessToken, 'short_term', 5);
            topArtists = topArtistsData.items || [];
        } catch (err) {
            console.warn("Recs API: Spotify Top Artists fetch failed.", err);
        }

        // 3. Prepare Seeds
        let seedTrackIds = topTracks.map(t => t.id).slice(0, 3);
        let seedArtistIds = topArtists.map(a => a.id).slice(0, 2);

        // Fallback seeds if user has no history
        if (seedTrackIds.length === 0 && seedArtistIds.length === 0) {
            // Use 'The Weeknd' (artist) and 'Blinding Lights' (track) as generic global seeds
            seedArtistIds = ['1Xyo4u8uXC1ZmMpatF05PJ'];
            seedTrackIds = ['0VjIjW4GlUZAMYd2vXMi3b'];
        }

        // 4. Get New Recommendations
        let recs = [];
        try {
            // Smart mixing of seeds: prioritize tracks, but use artist if needed
            const seeds = [...seedTrackIds, ...seedArtistIds].slice(0, 5); // Max 5 seeds allowed

            // We strictly need VALID seeds. 
            // If we mix types, we need to be careful. The library function uses `seed_tracks` hardcoded?
            // Checking library... yes, it uses `seed_tracks: seedTracks.join(',')`. 
            // FIX: We must pass strictly TRACK IDs if the lib function is hardcoded for tracks.
            // Actually, the lib function logic: `const params = new URLSearchParams({ seed_tracks: seedTracks.join(','), ...options });`
            // So if we pass artist IDs as 'seed_tracks', it will fail.
            // We should just use TRACK IDs from top tracks. If we have 0 top tracks, we use fallback track seeds.

            const validTrackSeeds = topTracks.map(t => t.id).slice(0, 5);
            const finalSeeds = validTrackSeeds.length > 0 ? validTrackSeeds : ['0VjIjW4GlUZAMYd2vXMi3b'];

            recs = await getRecommendations(session.accessToken, finalSeeds, { limit: 50 });
        } catch (spotifyErr) {
            console.error("Recs API: Spotify Recommendations failed:", spotifyErr.message);
        }

        // 5. COMBINE: My Top Songs + New Discoveries
        // The user wants to see their top songs too!
        const mixedRawTracks = [...topTracks, ...recs];

        // 6. Strict Filtering: MUST Have Preview URL
        // We Deduplicate by ID
        const seenIds = new Set();
        let validTracks = mixedRawTracks
            .filter(track => {
                if (!track || !track.preview_url) return false;
                if (seenIds.has(track.id)) return false;
                seenIds.add(track.id);
                return true;
            })
            .map(track => ({
                track_id: track.id,
                title: track.name || "Unknown Track",
                artist: track.artists?.map(a => a.name).join(', ') || "Unknown Artist",
                album: track.album?.name || "Unknown Album",
                cover_url: track.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format",
                preview_url: track.preview_url,
                color: '#1DB954'
            }));

        // 7. HYBRID FILLER: If tracks < 10, fill with Curated Catalog
        if (validTracks.length < 10) {
            const currentIds = new Set(validTracks.map(t => t.track_id));
            const fillers = FALLBACK_CATALOG.filter(kt => !currentIds.has(kt.track_id));
            validTracks = [...validTracks, ...fillers];
        }

        // 8. Update catalog safely
        if (validTracks.length > 0 && supabaseAdmin) {
            try {
                await supabaseAdmin
                    .from('songs')
                    .upsert(
                        validTracks.map(t => ({
                            track_id: t.track_id,
                            title: t.title,
                            artist: t.artist,
                            album: t.album,
                            cover_url: t.cover_url
                        })),
                        { onConflict: 'track_id' }
                    );
            } catch (catalogErr) {
                // Silent fail
            }
        }

        return NextResponse.json(validTracks);
    } catch (err) {
        console.error('Recs API Critical Failure:', err);
        return NextResponse.json(FALLBACK_CATALOG);
    }
}
