import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAudioFeatures } from "@/lib/spotify";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    try {
        // 1. Pull user journal (last 50 signals)
        const { data: journal, error: journalError } = await supabaseAdmin
            .from('music_journal')
            .select('track_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (journalError) throw journalError;
        if (!journal || journal.length < 5) {
            return NextResponse.json({ message: "Not enough data yet. Interact more!" });
        }

        const trackIds = [...new Set(journal.map(j => j.track_id))];

        // 2. Fetch Audio Features from Spotify
        const featuresData = await getAudioFeatures(session.accessToken, trackIds);
        const features = featuresData.audio_features.filter(f => f !== null);

        if (features.length === 0) throw new Error("Could not retrieve audio features.");

        // 3. Compute Averages
        const avg_energy = features.reduce((acc, f) => acc + f.energy, 0) / features.length;
        const avg_valence = features.reduce((acc, f) => acc + f.valence, 0) / features.length;

        // 4. Determine Mood Tag
        let mood_tag = "Musical Explorer";
        if (avg_energy < 0.4 && avg_valence < 0.4) mood_tag = "Late Night 🌙";
        else if (avg_energy > 0.7) mood_tag = "Workout High ⚡";
        else if (avg_valence > 0.6) mood_tag = "Happy Vibe ✨";
        else if (avg_energy < 0.4) mood_tag = "Chill Session ☕";

        // 5. Upsert into user_taste_profile
        const { error: upsertError } = await supabaseAdmin
            .from('user_taste_profile')
            .upsert({
                user_id: userId,
                avg_energy,
                avg_valence,
                mood_tag,
                updated_at: new Date().toISOString()
            });

        if (upsertError) throw upsertError;

        return NextResponse.json({ mood_tag, avg_energy, avg_valence });
    } catch (error) {
        console.error("AI Recalculation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
