import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTopTracks, getTopArtists, getRecommendations, getRecentlyPlayed, getMySavedTracks } from "@/lib/spotify";
import { FALLBACK_CATALOG } from "@/lib/fallback-catalog";

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

        // 6. Strict Filtering: MUST Have Preview URL (Pure Discovery Mode)
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
                preview_url: track.preview_url, // Might be null for user tracks
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

        // 9. If we have NO valid tracks and it was an API error, tell the user
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
        return NextResponse.json(FALLBACK_CATALOG);
    }
}
