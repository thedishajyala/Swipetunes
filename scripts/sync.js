import SpotifyWebApi from 'spotify-web-api-node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey || !supabaseUrl) {
    console.error('Missing Supabase Credentials');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    try {
        console.log("Initializing Spotify...");
        const spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        });

        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
        console.log("Spotify Authenticated.");

        console.log("Searching tracks...");
        const dataTracks = await spotifyApi.searchTracks('genre:pop', { limit: 50 });
        const tracksItems = dataTracks.body.tracks.items;

        console.log(`Found ${tracksItems.length} tracks.`);

        const tracks = tracksItems.map(track => {
            const image = track.album.images.length > 0 ? track.album.images[0].url : null;
            return {
                "spotifyId": track.id,
                name: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                "coverImage": image,
                "previewUrl": track.preview_url,
                popularity: track.popularity,
                genre: 'Pop'
            };
        });

        console.log("Upserting to Supabase 'tracks' table...");
        const { error } = await supabaseAdmin
            .from('tracks')
            .upsert(tracks, { onConflict: 'spotifyId', ignoreDuplicates: false });

        if (error) {
            console.error("Supabase Error:", error);
        } else {
            console.log("Success! Tracks synced.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
