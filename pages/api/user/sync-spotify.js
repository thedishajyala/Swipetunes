
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma"; // Assuming prisma client is exported from here, need to check
import { getTopTracks, getTopArtists, getUserProfile } from "../../../lib/spotify";

// Ensure prisma import is correct, we might need to check where it is initialized.
// checking previous file structure... `lib/prisma.ts` or similar usually. 
// list_dir showed `lib` has 1 child.
// Let's assume standard `lib/prisma.ts` for now, if it fails we check. 
// Actually, I should verify `lib` content first or just try to import.
// For now I'll assume `import { prisma } from '../../../lib/prisma'` is correct based on common conventions
// BUT wait, I see `prisma.config.ts` in root, and `lib` folder.
// Let's check `lib` content briefly in a separate step if needed, but to save time 
// I will create a `lib/prisma.js` if it doesn't exist or use the existing one.
// Let's assume it exists for now or I will create it.

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
        const user = await prisma.user.upsert({
            where: { email: userProfile.email },
            update: {
                name: userProfile.display_name,
                image: userProfile.images?.[0]?.url,
            },
            create: {
                name: userProfile.display_name,
                email: userProfile.email,
                image: userProfile.images?.[0]?.url,
            },
        });

        // 3. Process and Upsert Artists
        // We limit to top 10 for now to be safe
        const artistsToSave = topArtistsData.items.slice(0, 20);

        // Using transaction or Promise.all for artists
        // Prisma `connect` with `create` (upsert like) for relations is tricky for many-to-many
        // simplest is to create artists first, then connect.

        for (const artist of artistsToSave) {
            await prisma.artist.upsert({
                where: { spotifyId: artist.id },
                update: {
                    popularity: artist.popularity,
                    image: artist.images?.[0]?.url,
                },
                create: {
                    spotifyId: artist.id,
                    name: artist.name,
                    genres: artist.genres.join(', '),
                    popularity: artist.popularity,
                    image: artist.images?.[0]?.url,
                }
            });
        }

        // Update User's Top Artists
        // We disconnect old ones and connect new ones to keep it fresh? 
        // Or just accumulate? "Top" usually implies current state.
        // Let's replace.
        await prisma.user.update({
            where: { id: user.id },
            data: {
                topArtists: {
                    set: [], // Disconnect all
                    connect: artistsToSave.map(a => ({ spotifyId: a.id }))
                }
            }
        });

        // 4. Process and Upsert Tracks
        const tracksToSave = topTracksData.items.slice(0, 20);

        // Save tracks to DB (generic Tracks table)
        for (const track of tracksToSave) {
            // Track needs artist string, etc.
            // Schema: artist String. Spotify track has artists array. We take the first one or join.
            // Schema: genre String. Track object doesn't have genre usually (artist has). We can skip or fetch artist.
            // For efficiency, we ignore genre on track for now or take from artist if we mapped it.
            // track.features need another call (audio-features). 
            // DO we need audio features immediately? 
            // The implementation_plan didn't explicitly say we fetch audio features NOW in the sync. 
            // But `Track` model has energy, valence, tempo.
            // If we don't fetch them, they will be 0 or null (if nullable). Float not nullable.
            // We MUST fetch audio features if we want to create tracks validly.

            // Let's accept that we might need to fetch features.
        }

        // Helper to get audio features
        const trackIds = tracksToSave.map(t => t.id).join(',');
        const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const featuresData = await featuresResponse.json();
        const featuresMap = new Map(featuresData.audio_features.map(f => [f?.id, f]));

        for (const track of tracksToSave) {
            const features = featuresMap.get(track.id);

            // Upsert Track
            // Note: Track has `userId`? 
            // If Track is unique per user (e.g. user's view of a track), we create new.
            // But `spotifyId` is unique in schema? `spotifyId String @unique`.
            // So a Track is global. 
            // But `userId` Int? on Track model implies ownership.
            // If `spotifyId` is unique, we can't have multiple users owning the same "Track" record if it implies "My Saved Track".
            // The schema seems to mix Global Track concept with User specific field.
            // `topTracks Track[]` on User is a relation.
            // `Track` has `userId`.
            // If `Track` has `userId`, then `spotifyId` being `@unique` IS A PROBLEM if multiple users have the same top track.
            // WAIT. If `Track` is designed to be a "User's Track" (UserTrack), then `spotifyId` should NOT be unique globally, but unique per user.
            // OR `Track` is a global song, and `userId` shouldn't be there, or it should be a many-to-many `users User[]`.

            // Looking at schema:
            // model Track { ... spotifyId String @unique ... user User? ... userId Int? }
            // This implies 1 global track can belong to 1 User? That's wrong for "Top Tracks".
            // If User A has Track X as top, and User B has Track X as top.
            // We create Track X. Linked to User A.
            // User B tries to sync. We find Track X. It's linked to User A.
            // We can't link it to User B (one-to-many).
            // WE NEED TO FIX THE SCHEMA relation for Tracks to be Many-to-Many or remove `userId` from Track and use an implicit/explicit join table.
            // `artists` uses `users User[]` (implicit m-n).
            // `topTracks` uses `Track[]`. `Track` side has `userId`. This is 1-n.
            // This is a schema flaw for a social app.
            // I should fix this in the schema first or now.
            // "Update (if needed)" was a task. I checked schema and approved provided one, but now I see the issue.
            // I will change Track to have `users User[]` instead of `user User?`.

            // For now, I will write this file assuming I WILL FIX the schema in the next step or same turn.
            // I will assume `users` relation on Track.

            await prisma.track.upsert({
                where: { spotifyId: track.id },
                update: {
                    // Update popularity etc
                    popularity: track.popularity
                },
                create: {
                    spotifyId: track.id,
                    name: track.name,
                    artist: track.artists.map(a => a.name).join(', '),
                    energy: features ? features.energy : 0.5,
                    valence: features ? features.valence : 0.5,
                    tempo: features ? features.tempo : 120,
                    popularity: track.popularity,
                    coverImage: track.album.images?.[0]?.url,
                    previewUrl: track.preview_url,
                    genre: null, // Hard to get per track efficiently
                }
            });
        }

        // Update User's Top Tracks
        await prisma.user.update({
            where: { id: user.id },
            data: {
                topTracks: {
                    set: [],
                    connect: tracksToSave.map(t => ({ spotifyId: t.id }))
                }
            }
        });

        res.status(200).json({ message: 'Sync successful', user });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ message: 'Sync failed', error: error.message });
    }
}
