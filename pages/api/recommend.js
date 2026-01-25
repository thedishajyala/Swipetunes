import prisma from '../../lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id) : 1;

    try {
        // 1. Get all liked swipes to analyze preferences
        const likedSwipes = await prisma.swipe.findMany({
            where: { userId, liked: true },
            include: { track: true },
        });

        // Also get all swiped track IDs to exclude them from recommendations
        const allSwipes = await prisma.swipe.findMany({
            where: { userId },
            select: { trackId: true }
        });
        const swipedTrackIds = new Set(allSwipes.map(s => s.trackId));

        if (!likedSwipes.length) {
            // Cold start: Just return popular tracks we haven't swiped yet
            const coldStartRecs = await prisma.track.findMany({
                where: { id: { notIn: Array.from(swipedTrackIds) } },
                orderBy: { popularity: 'desc' },
                take: 10
            });
            return res.status(200).json({ recommendations: coldStartRecs });
        }

        // 2. Average Audio Features
        const avgFeatures = likedSwipes.reduce(
            (acc, swipe) => {
                acc.energy += swipe.track.energy;
                acc.valence += swipe.track.valence;
                acc.tempo += swipe.track.tempo;
                return acc;
            },
            { energy: 0, valence: 0, tempo: 0 }
        );
        avgFeatures.energy /= likedSwipes.length;
        avgFeatures.valence /= likedSwipes.length;
        avgFeatures.tempo /= likedSwipes.length;

        // 3. Genre Preferences (Frequency Map)
        const genreCounts = {};
        let totalGenreSwipes = 0;
        likedSwipes.forEach(s => {
            if (s.track.genre) {
                genreCounts[s.track.genre] = (genreCounts[s.track.genre] || 0) + 1;
                totalGenreSwipes++;
            }
        });

        // 4. Fetch Candidate Tracks (not yet swiped)
        const candidates = await prisma.track.findMany({
            where: {
                id: { notIn: Array.from(swipedTrackIds) }
            }
        });

        // 5. Scoring Algorithm
        const scoredCandidates = candidates.map(track => {
            // A. Feature Similarity Score (0 to 1)
            // Lower distance = Higher score
            const energyDiff = Math.abs(track.energy - avgFeatures.energy);
            const valenceDiff = Math.abs(track.valence - avgFeatures.valence);
            const tempoDiff = Math.abs(track.tempo - avgFeatures.tempo) / 200; // Normalize tempo roughly

            const featureDistance = (energyDiff + valenceDiff + tempoDiff) / 3;
            const featureScore = Math.max(0, 1 - featureDistance);

            // B. Genre Bonus (0 to 1)
            let genreScore = 0;
            if (track.genre && genreCounts[track.genre]) {
                genreScore = genreCounts[track.genre] / totalGenreSwipes;
            }

            // C. Final Weighted Score
            // 70% Features, 30% Genre
            const totalScore = (featureScore * 0.7) + (genreScore * 0.3);

            return { ...track, score: totalScore, matchDebug: { featureScore, genreScore } };
        });

        // 6. Sort and Return Top 10
        const recommendations = scoredCandidates
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        res.status(200).json({ recommendations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
