import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from "../../../lib/supabase";
import { getTopTracks, getTopArtists, getUserProfile } from "../../../lib/spotify";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.accessToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const accessToken = session.accessToken;

        // 1. Fetch data from Spotify
        const [userProfile, topTracksData, topArtistsData] = await Promise.all([
            getUserProfile(accessToken),
            getTopTracks(accessToken),
            getTopArtists(accessToken)
        ]);

        // 2. Upsert User
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .upsert({
                email: userProfile.email,
                name: userProfile.display_name,
                image: userProfile.images?.[0]?.url,
            }, { onConflict: 'email' })
            .select()
            .single();

        if (userError) throw userError;

        // 3. Process and Upsert Artists
        const artistsToSave = topArtistsData.items.slice(0, 20);
        const artistPayloads = artistsToSave.map(artist => ({
            "spotifyId": artist.id,
            name: artist.name,
            genres: artist.genres.join(', '),
            popularity: artist.popularity,
            image: artist.images?.[0]?.url,
        }));

        const { data: savedArtists, error: artistsError } = await supabaseAdmin
            .from('artists')
            .upsert(artistPayloads, { onConflict: 'spotifyId' })
            .select();

        if (artistsError) throw artistsError;

        // Update User's Top Artists
        await supabaseAdmin.from('user_top_artists').delete().eq('userId', user.id);

        if (savedArtists && savedArtists.length > 0) {
            const artistConnections = savedArtists.map(a => ({
                "userId": user.id,
                "artistId": a.id
            }));
            await supabaseAdmin.from('user_top_artists').insert(artistConnections);
        }

        // 4. Process and Upsert Tracks
        const tracksToSave = topTracksData.items.slice(0, 20);

        // Fetch audio features
        const trackIds = tracksToSave.map(t => t.id).join(',');
        const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const featuresData = await featuresResponse.json();
        const featuresMap = new Map(featuresData.audio_features.map(f => [f?.id, f]));

        const trackPayloads = tracksToSave.map(track => {
            const features = featuresMap.get(track.id);
            return {
                "spotifyId": track.id,
                name: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                energy: features ? features.energy : 0.5,
                valence: features ? features.valence : 0.5,
                tempo: features ? features.tempo : 120,
                popularity: track.popularity,
                "coverImage": track.album.images?.[0]?.url,
                "previewUrl": track.preview_url,
                // genre: null, // Default
            };
        });

        const { data: savedTracks, error: tracksError } = await supabaseAdmin
            .from('tracks')
            .upsert(trackPayloads, { onConflict: 'spotifyId' })
            .select();

        if (tracksError) throw tracksError;

        // Update User's Top Tracks
        await supabaseAdmin.from('user_top_tracks').delete().eq('userId', user.id);

        if (savedTracks && savedTracks.length > 0) {
            const trackConnections = savedTracks.map(t => ({
                "userId": user.id,
                "trackId": t.id
            }));
            await supabaseAdmin.from('user_top_tracks').insert(trackConnections);
        }

        res.status(200).json({ message: 'Sync successful', user });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ message: 'Sync failed', error: error.message });
    }
}
