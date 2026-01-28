import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function GET() {
    try {
        const spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        });

        // 1. Client Credentials Flow
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);

        // 2. Fetch Top Tracks via Search (More reliable than Playlist ID for client creds)
        const dataTracks = await spotifyApi.searchTracks('genre:pop', { limit: 50 });
        const tracksItems = dataTracks.body.tracks.items;

        if (!tracksItems || tracksItems.length === 0) {
            throw new Error('No tracks found from Spotify');
        }

        const tracks = tracksItems.map(track => {
            // Get the highest resolution image
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

        // 3. Batch fetch Audio Features (max 100)
        const trackIds = tracks.map(t => t.spotifyId);
        let audioFeatures = [];
        if (trackIds.length > 0) {
            const audioFeaturesData = await spotifyApi.getAudioFeaturesForTracks(trackIds);
            audioFeatures = audioFeaturesData.body.audio_features;
        }

        // Merge features
        const enrichedTracks = tracks.map((track, i) => {
            const features = audioFeatures ? audioFeatures[i] : null;
            return {
                ...track,
                energy: features ? features.energy : null,
                valence: features ? features.valence : null,
                tempo: features ? features.tempo : null,
            };
        });

        // 4. Insert into Supabase
        const { error } = await supabaseAdmin
            .from('tracks')
            .upsert(enrichedTracks, { onConflict: 'spotifyId', ignoreDuplicates: false });

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Successfully synced tracks',
            count: enrichedTracks.length
        });

    } catch (err) {
        console.error('Sync Error:', err);
        return NextResponse.json({ error: 'Failed to sync tracks', details: err.message }, { status: 500 });
    }
}
