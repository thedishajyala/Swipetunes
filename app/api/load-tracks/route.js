import prisma from "../../../lib/prisma";

export async function GET() {
    try {
        const res = await fetch("http://localhost:3000/api/deezer");
        const tracks = await res.json();

        for (const track of tracks) {
            await prisma.track.upsert({
                where: { spotifyId: track.spotifyId },
                update: {},
                create: track,
            });
        }

        return Response.json({ message: "Tracks loaded from Deezer!" });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
