import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getRecommendations } from "@/lib/spotify";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'vibe'; // 'vibe', 'morning', 'workout', 'focus'

    try {
        // 1. Fetch seed data for AI (Recent Swipes & Shared Tracks)
        const { data: recentLikes } = await supabaseAdmin
            .from('likes')
            .select('track_id')
            .eq('user_id', userId)
            .limit(3);

        const { data: sharedTracks } = await supabaseAdmin
            .from('messages')
            .select('track_shared')
            .not('track_shared', 'is', null)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .limit(2);

        const seedTrackIds = [
            ...(recentLikes?.map(l => l.track_id) || []),
            ...(sharedTracks?.map(t => t.track_shared) || [])
        ].filter(Boolean).slice(0, 5);

        // 2. Fetch from Spotify with Mood Overlays 
        // (In a real app, we'd adjust target_tempo, target_energy based on 'mode')
        const moodParams = {
            'morning': { target_energy: 0.4, target_valence: 0.6 },
            'workout': { min_tempo: 120, target_energy: 0.8 },
            'focus': { target_energy: 0.3, target_acousticness: 0.7 },
            'vibe': { target_popularity: 50 }
        };

        const tracks = await getRecommendations(
            session.accessToken,
            seedTrackIds.length > 0 ? seedTrackIds : ['4cOdK9sSTH1YyM9G9yYI92'], // Fallback seed
            moodParams[mode] || {}
        );

        return NextResponse.json(tracks);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
