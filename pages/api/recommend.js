import prisma from '../../lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id) : 1;

    try {
        // Get all liked tracks of the user
        const likedTracks = await prisma.swipe.findMany({
            where: { userId, liked: true },
            include: { track: true },
        });

        if (!likedTracks.length) return res.status(200).json({ recommendations: [] });

        // Calculate average features
        const avg = likedTracks.reduce(
            (acc, swipe) => {
                acc.energy += swipe.track.energy;
                acc.valence += swipe.track.valence;
                acc.tempo += swipe.track.tempo;
                return acc;
            },
            { energy: 0, valence: 0, tempo: 0 }
        );

        avg.energy /= likedTracks.length;
        avg.valence /= likedTracks.length;
        avg.tempo /= likedTracks.length;

        // Recommend tracks not yet swiped
        const allTracks = await prisma.track.findMany();
        const swipedTrackIds = likedTracks.map((s) => s.trackId);

        const recommendations = allTracks
            .filter((t) => !swipedTrackIds.includes(t.id))
            .map((t) => {
                // Simple similarity score
                // Normalize tempo to 0-1 range roughly (assuming max tempo around 200) for better comparison
                // or just use raw diff. The original code used raw diff which is fine for simple logic.
                // We stick to the provided logic.
                const score =
                    1 -
                    (Math.abs(t.energy - avg.energy) +
                        Math.abs(t.valence - avg.valence) +
                        Math.abs(t.tempo - avg.tempo) / 200) / // Normalizing tempo diff contribution
                    3;
                return { ...t, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // top 10 recommendations

        res.status(200).json({ recommendations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
