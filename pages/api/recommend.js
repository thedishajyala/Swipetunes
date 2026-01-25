import { supabaseAdmin } from '../../lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id ? session.user.id : null;

    if (!userId) {
        // Fallback for demo if no user, or just handle gracefully
        // For now, if no user, we can't recommend much personalized, but maybe generic popular.
        // Let's assume we need a user.
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // 1. Get all liked swipes
        const { data: likedSwipes, error: likedError } = await supabaseAdmin
            .from('swipes')
            .select(`
                *,
                track:tracks (*)
            `)
            .eq('userId', userId)
            .eq('liked', true);

        if (likedError) throw likedError;

        // Also get all swiped track IDs to exclude them from recommendations
        const { data: allSwipes, error: swipesError } = await supabaseAdmin
            .from('swipes')
            .select('trackId')
            .eq('userId', userId);

        if (swipesError) throw swipesError;

        const swipedTrackIds = new Set(allSwipes.map(s => s.trackId));

        if (!likedSwipes.length) {
            // Cold start
            let query = supabaseAdmin
                .from('tracks')
                .select('*')
                .order('popularity', { ascending: false })
                .limit(10);

            if (swipedTrackIds.size > 0) {
                query = query.not('id', 'in', `(${Array.from(swipedTrackIds).join(',')})`);
            }

            const { data: coldStartRecs, error: coldError } = await query;
            if (coldError) throw coldError;

            return res.status(200).json({ recommendations: coldStartRecs });
        }

        // 2. Average Audio Features
        const avgFeatures = likedSwipes.reduce(
            (acc, swipe) => {
                // Check if track exists (it should due to join)
                if (swipe.track) {
                    acc.energy += swipe.track.energy;
                    acc.valence += swipe.track.valence;
                    acc.tempo += swipe.track.tempo;
                }
                return acc;
            },
            { energy: 0, valence: 0, tempo: 0 }
        );
        avgFeatures.energy /= likedSwipes.length;
        avgFeatures.valence /= likedSwipes.length;
        avgFeatures.tempo /= likedSwipes.length;

        // 3. Genre Preferences
        const genreCounts = {};
        let totalGenreSwipes = 0;
        likedSwipes.forEach(s => {
            if (s.track && s.track.genre) {
                genreCounts[s.track.genre] = (genreCounts[s.track.genre] || 0) + 1;
                totalGenreSwipes++;
            }
        });

        // 4. Fetch Candidate Tracks
        // Avoid "IN" clause with empty array error
        let candidateQuery = supabaseAdmin.from('tracks').select('*');
        if (swipedTrackIds.size > 0) {
            // Supabase filter syntax for list of integers
            candidateQuery = candidateQuery.not('id', 'in', `(${Array.from(swipedTrackIds).join(',')})`);
        }

        const { data: candidates, error: candidateError } = await candidateQuery;
        if (candidateError) throw candidateError;

        // 5. Scoring Algorithm
        const scoredCandidates = candidates.map(track => {
            const energyDiff = Math.abs(track.energy - avgFeatures.energy);
            const valenceDiff = Math.abs(track.valence - avgFeatures.valence);
            const tempoDiff = Math.abs(track.tempo - avgFeatures.tempo) / 200;

            const featureDistance = (energyDiff + valenceDiff + tempoDiff) / 3;
            const featureScore = Math.max(0, 1 - featureDistance);

            let genreScore = 0;
            if (track.genre && genreCounts[track.genre]) {
                genreScore = genreCounts[track.genre] / totalGenreSwipes;
            }

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
