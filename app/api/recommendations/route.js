import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        });
        spotifyApi.setAccessToken(session.accessToken);

        // 1. Fetch user's top tracks to use as seeds
        const topTracksData = await spotifyApi.getMyTopTracks({ limit: 5 });
        const seedTracks = topTracksData.body.items.map(t => t.id);

        if (seedTracks.length === 0) {
            // Fallback to general pop if user has no top tracks
            seedTracks.push('4iJyoBOLtHqaGxP12qzhQI'); // Peaches as fallback
        }

        // 2. Get recommendations based on seeds
        const recsData = await spotifyApi.getRecommendations({
            min_energy: 0.4,
            seed_tracks: seedTracks.slice(0, 5),
            limit: 20
        });

        const tracks = recsData.body.tracks.map(track => {
            return {
                spotifyId: track.id,
                name: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                coverImage: track.album.images.length > 0 ? track.album.images[0].url : null,
                previewUrl: track.preview_url,
                popularity: track.popularity,
                genre: 'Recommended'
            };
        });

        // 3. Sync to DB for caching/trending logic
        await supabaseAdmin
            .from('tracks')
            .upsert(tracks, { onConflict: 'spotifyId', ignoreDuplicates: false });

        return NextResponse.json(tracks);

    } catch (err) {
        console.error('Recommendation Error:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
