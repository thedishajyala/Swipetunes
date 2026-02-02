import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        });

        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);

        const dataTracks = await spotifyApi.searchTracks('genre:pop', { limit: 50 });
        const tracksItems = dataTracks.body.tracks.items;

        if (!tracksItems || tracksItems.length === 0) {
            throw new Error('No tracks found from Spotify');
        }

        const enrichedTracks = tracksItems.map(track => ({
            track_id: track.id,
            title: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            album: track.album.name,
            cover_url: track.album.images[0]?.url,
            created_at: new Date().toISOString()
        }));

        const { error } = await supabaseAdmin
            .from('songs')
            .upsert(enrichedTracks, { onConflict: 'track_id' });

        if (error) throw error;

        return NextResponse.json({
            message: 'Successfully synced tracks to catalog',
            count: enrichedTracks.length
        });

    } catch (err) {
        console.error('Sync Error:', err);
        return NextResponse.json({ error: 'Failed to sync tracks', details: err.message }, { status: 500 });
    }
}
