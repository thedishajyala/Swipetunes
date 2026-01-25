import prisma from "../../../lib/prisma";

export async function GET() {
    try {
        // 1. Get tracks without genres
        const tracks = await prisma.track.findMany({
            where: { genre: null },
            take: 50, // Process in batches
        });

        if (tracks.length === 0) {
            return Response.json({ message: "No tracks need genre update." });
        }

        const GENRES = ["Pop", "Rock", "Hip-Hop", "R&B", "Indie", "Electronic", "Jazz", "Classical"];

        // 2. Mock Last.fm Genre Fetching
        // In a real app, we would call:
        // fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${track.artist}&api_key=${API_KEY}&format=json`)

        let updatedCount = 0;

        for (const track of tracks) {
            // Simulate API call delay
            // await new Promise(r => setTimeout(r, 100)); 

            // Assign a random genre deterministically based on artist name length (just for consistent testing) or random
            const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];

            await prisma.track.update({
                where: { id: track.id },
                data: { genre: randomGenre },
            });
            updatedCount++;
        }

        return Response.json({
            message: `Updated ${updatedCount} tracks with genres.`,
            tracksUpdated: updatedCount
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
