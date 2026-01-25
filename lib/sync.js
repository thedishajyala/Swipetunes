import { supabaseAdmin } from "./supabase";
import SpotifyWebApi from "spotify-web-api-node";

export async function syncSpotifyData(userId, accessToken) {
    try {
        const spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        });

        spotifyApi.setAccessToken(accessToken);

        const [me, topArtists] = await Promise.all([
            spotifyApi.getMe(),
            spotifyApi.getMyTopArtists({ limit: 50, time_range: "medium_term" }),
        ]);

        // Update User Profile
        const { error: userError } = await supabaseAdmin
            .from('users')
            .update({
                name: me.body.display_name,
                image: me.body.images?.[0]?.url,
                "spotifyUrl": me.body.external_urls?.spotify,
            })
            .eq('id', userId);

        if (userError) console.error("Error updating user:", userError);

        // Sync Top Artists
        const artistIds = [];

        for (const artist of topArtists.body.items) {
            // Upsert Artist
            // Note: Supabase upsert requires unique constraint. spotifyId should be unique.
            const { data: savedArtist, error: artistError } = await supabaseAdmin
                .from('artists')
                .upsert({
                    "spotifyId": artist.id,
                    name: artist.name,
                    image: artist.images?.[0]?.url,
                    genres: artist.genres.join(", "),
                    popularity: artist.popularity,
                }, { onConflict: 'spotifyId' })
                .select()
                .single();

            if (artistError) {
                console.error("Error upserting artist:", artistError);
            } else if (savedArtist) {
                artistIds.push(savedArtist.id);
            }
        }

        // Connect Artists to User (Replace existing)
        // 1. Delete existing connections for this user
        await supabaseAdmin
            .from('user_top_artists')
            .delete()
            .eq('userId', userId);

        // 2. Insert new connections
        if (artistIds.length > 0) {
            const connections = artistIds.map(artistId => ({
                "userId": userId,
                "artistId": artistId
            }));

            const { error: connectError } = await supabaseAdmin
                .from('user_top_artists')
                .insert(connections);

            if (connectError) console.error("Error connecting artists:", connectError);
        }

        console.log(`Synced data for user ${userId}`);

    } catch (error) {
        console.error("Error syncing Spotify data:", error);
    }
}
