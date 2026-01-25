import { prisma } from "./prisma";
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
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: me.body.display_name,
                image: me.body.images?.[0]?.url,
                spotifyUrl: me.body.external_urls?.spotify,
                // bio: me.body.product === 'premium' ? 'Spotify Premium User' : 'Music Lover', // Optional default bio
            },
        });

        // Sync Top Artists
        const artistConnects = [];

        for (const artist of topArtists.body.items) {
            // Upsert Artist
            const savedArtist = await prisma.artist.upsert({
                where: { spotifyId: artist.id },
                update: {
                    popularity: artist.popularity,
                    image: artist.images?.[0]?.url,
                },
                create: {
                    spotifyId: artist.id,
                    name: artist.name,
                    image: artist.images?.[0]?.url,
                    genres: artist.genres.join(", "),
                    popularity: artist.popularity,
                },
            });
            artistConnects.push({ id: savedArtist.id });
        }

        // Connect Artists to User (Replace existing)
        // Prisma doesn't have a simple "replace" for many-to-many, so we might append or wipe and add.
        // For now, let's just connect. If already connected, it might throw or ignore depending on schema.
        // Ideally we disconnect old ones first.

        // For simplicity in this prototype, let's just connect new ones.
        await prisma.user.update({
            where: { id: userId },
            data: {
                topArtists: {
                    set: artistConnects // 'set' replaces the connections!
                }
            }
        })

        console.log(`Synced data for user ${userId}`);

    } catch (error) {
        console.error("Error syncing Spotify data:", error);
    }
}
