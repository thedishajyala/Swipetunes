import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTopTracks, getTopArtists, getRecommendations, getRecentlyPlayed, getMySavedTracks } from "@/lib/spotify";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Parallel Fetch: Top Tracks (50) + Recent (50) + Saved (50)
        // This maximizes our chances of finding playable audio.
        let topTracks = [];
        let recentTracks = [];
        let savedTracks = [];
        let apiError = null;

        const [topData, recentData, savedData] = await Promise.allSettled([
            getTopTracks(session.accessToken, 'short_term', 50),
            getRecentlyPlayed(session.accessToken, 50),
            getMySavedTracks(session.accessToken, 50)
        ]);

        if (topData.status === 'fulfilled') topTracks = topData.value.items || [];
        else apiError = topData.reason.message;

        if (recentData.status === 'fulfilled') {
            // Recent tracks structure is different: item.track
            recentTracks = recentData.value.items?.map(item => item.track) || [];
        }

        if (savedData.status === 'fulfilled') {
            // Saved tracks structure: item.track
            savedTracks = savedData.value.items?.map(item => item.track) || [];
        }

        // 2. Fetch Top Artists (Backup Seeds)
        let topArtists = [];
        try {
            const topArtistsData = await getTopArtists(session.accessToken, 'short_term', 5);
            topArtists = topArtistsData.items || [];
        } catch (err) {
            console.warn("Recs API: Spotify Top Artists fetch failed.", err);
        }

        // 3. Prepare Seeds from Top Tracks
        const validTrackSeeds = topTracks.slice(0, 5).map(t => t.id);
        const finalSeeds = validTrackSeeds.length > 0 ? validTrackSeeds : ['0VjIjW4GlUZAMYd2vXMi3b'];

        // 4. Get New Recommendations
        let recs = [];
        try {
            recs = await getRecommendations(session.accessToken, finalSeeds, { limit: 50 });
        } catch (spotifyErr) {
            console.error("Recs API: Spotify Recommendations failed:", spotifyErr.message);
        }

        // 5. COMBINE ALL SOURCES (To find seeds/candidates)
        const mixedRawTracks = [...topTracks, ...recentTracks, ...savedTracks, ...recs];

        // 5. Filter: Prioritize Tracks with Previews, but accept Visual-Only if needed
        const seenIds = new Set();
        const allUniqueTracks = mixedRawTracks.filter(t => {
            if (!t) return false;
            if (seenIds.has(t.id)) return false;
            seenIds.add(t.id);
            return true;
        });

        // First, get strictly playable tracks
        let validTracks = allUniqueTracks.filter(t => t.preview_url);

        // If we don't have enough playable tracks (e.g. < 10), fill up with non-playable recommendations
        // This prevents the "Demo Songs" issue while trying to provide audio key.
        if (validTracks.length < 5) {
            console.log("Recs API: Insufficient playable tracks found. Attempting generic fallback...");
            try {
                // Fallback: Get recommendations based on popular genres to ensure we have content
                // Seeds: pop, dance, hip-hop, rock, indie
                const fallbackRecs = await getRecommendations(session.accessToken, [], {
                    limit: 20,
                    seed_genres: ['pop', 'dance', 'hip-hop', 'rock', 'indie'],
                    min_popularity: 50
                });

                const fallbackValid = fallbackRecs.filter(t => t.preview_url);

                // Add unique new tracks
                fallbackValid.forEach(t => {
                    if (!seenIds.has(t.id)) {
                        seenIds.add(t.id);
                        validTracks.push(t);
                    }
                });
            } catch (fallbackErr) {
                console.error("Recs API: Fallback fetch failed:", fallbackErr.message);
            }
        }

        // Final safety net: if we STILL have < 5, just relax the preview_url constraint
        // to show *something* (metadata only) rather than an empty screen.
        if (validTracks.length < 5) {
            const remainder = allUniqueTracks.filter(t => !t.preview_url && !seenIds.has(t.id));
            validTracks = [...validTracks, ...remainder.slice(0, 20)];
        }

        // Format for Frontend
        validTracks = validTracks.map(track => ({
            track_id: track.id,
            title: track.name || "Unknown Track",
            artist: track.artists?.map(a => a.name).join(', ') || "Unknown Artist",
            album: track.album?.name || "Unknown Album",
            cover_url: track.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format",
            preview_url: track.preview_url,
            color: '#1DB954'
        }));

        // 6. Update catalog safely
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

        // 7. Validation: If we STILL have nothing (e.g. API returned 0 recs), ONLY THEN error out.
        // We do NOT fall back to Demo Catalog unless it's a hard crash.
        if (validTracks.length === 0 && apiError) {
            return NextResponse.json({
                error: "Start Swiping Failed",
                details: "We couldn't fetch your music. Please Sign Out and Sign In again to update permissions.",
                debug_info: apiError
            }, { status: 403 });
        }

        return NextResponse.json(validTracks);
    } catch (err) {
        console.error('Recs API Critical Failure:', err);
        return NextResponse.json({ error: "Server Error", details: err.message }, { status: 500 });
    }
}
