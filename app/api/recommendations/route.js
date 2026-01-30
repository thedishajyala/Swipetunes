import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
    console.log("Recommendations API: Initiating fetch...");
    try {
        const session = await getServerSession(authOptions);
        console.log("Recommendations API: Session found?", !!session);
        if (session) console.log("Recommendations API: AccessToken length:", session.accessToken?.length);

        if (!session || !session.accessToken) {
            console.warn("Recommendations API: Unauthorized - No session or accessToken");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- UUID RESOLVER ---
        // Get profile using spotify_id to ensure we use the internal UUID
        // session.user.id might be a spotify_id string here depending on session status
        const lookupId = session.user.spotify_id || session.user.id;
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("spotify_id", lookupId)
            .maybeSingle();

        if (profileError || !profile) {
            console.warn("Recommendations API: Profile not found for spotify_id:", lookupId);
            // Optionally we could create it here, but auth.js should have done it.
            // For resilience, we'll continue using whatever is in session.user.id 
            // but we'll flag it for debugging.
        }

        const userId = profile ? profile.id : session.user.id;
        console.log("Recommendations API: Using internal userId:", userId);
        // --- END UUID RESOLVER ---

        const spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        });
        spotifyApi.setAccessToken(session.accessToken);

        // 1. Fetch user's top tracks to use as seeds
        console.log("Recommendations API: Fetching top tracks...");
        let seedTracks = [];
        try {
            const topTracksData = await spotifyApi.getMyTopTracks({ limit: 5 });
            seedTracks = topTracksData.body.items.map(t => t.id);
        } catch (err) {
            console.error("Recommendations API: Failed to fetch top tracks", err.message);
        }

        if (seedTracks.length === 0) {
            console.log("Recommendations API: No seed tracks found, using default fallback");
            seedTracks.push('4iJyoBOLtHqaGxP12qzhQI'); // Peaches as fallback
        }

        // 2. Get recommendations based on seeds
        console.log(`Recommendations API: Requesting Spotify recommendations for seeds: ${seedTracks.join(',')}`);
        const recsData = await spotifyApi.getRecommendations({
            seed_tracks: seedTracks.slice(0, 5),
            limit: 30 // Fetch more to allow filtering
        });

        const tracks = recsData.body.tracks
            .filter(track => track.preview_url && track.album.images.length > 0) // FILTER: Must have preview and image
            .map(track => {
                return {
                    spotifyId: track.id,
                    name: track.name,
                    artist: track.artists.map(a => a.name).join(', '),
                    coverImage: track.album.images[0].url,
                    previewUrl: track.preview_url,
                    popularity: track.popularity,
                    genre: 'Recommended'
                };
            }).slice(0, 20);

        console.log(`Recommendations API: Found ${tracks.length} valid tracks`);

        // 3. Sync to DB for caching/trending logic (RESILIENT: Continue even if this fails)
        if (tracks.length > 0) {
            console.log("Recommendations API: Syncing tracks to DB...");
            try {
                const { error: dbError } = await supabaseAdmin
                    .from('tracks')
                    .upsert(tracks, { onConflict: 'spotifyId' });

                if (dbError) {
                    console.error("Recommendations API: DB Sync failed (ignoring):", dbError.message);
                } else {
                    console.log("Recommendations API: DB Sync successful");
                }
            } catch (dbErr) {
                console.error("Recommendations API: DB Critical Sync failure (ignoring):", dbErr.message);
            }
        }

        console.log("Recommendations API: Returning successful response");
        return NextResponse.json(tracks);

    } catch (err) {
        console.error('Recommendations API: CRITICAL FAILURE:', err);
        return NextResponse.json({
            error: 'Failed to fetch recommendations',
            details: err.message,
            stack: err.stack,
            debug_info: {
                has_spotify_secret: !!process.env.SPOTIFY_CLIENT_SECRET,
                has_supabase_admin: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                env: process.env.NODE_ENV,
                api_error_name: err.name,
                api_error_code: err.statusCode || err.code
            }
        }, { status: 500 });
    }
}
