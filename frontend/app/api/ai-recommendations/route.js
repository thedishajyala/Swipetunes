import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getRecommendations } from "@/lib/spotify";

const FALLBACK_TRACKS = [
    {
        id: "0VjIjW4GlUZAMYd2vXMi3b",
        name: "Blinding Lights",
        artists: [{ name: "The Weeknd" }],
        album: { name: "After Hours", images: [{ url: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36" }] },
        popularity: 90,
        track_id: "0VjIjW4GlUZAMYd2vXMi3b"
    },
    {
        id: "21jGcNKet2qwijl0efuYtR",
        name: "Levitating",
        artists: [{ name: "Dua Lipa" }],
        album: { name: "Future Nostalgia", images: [{ url: "https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946" }] },
        popularity: 85,
        track_id: "21jGcNKet2qwijl0efuYtR"
    }
];

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = session.user.id;
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') || 'vibe';

        // 1. Fetch seed data
        const { data: recentLikes } = await supabaseAdmin
            .from('likes')
            .select('track_id')
            .eq('user_id', userId)
            .limit(3);

        const seedTrackIds = [
            ...(recentLikes?.map(l => l.track_id) || [])
        ].filter(Boolean).slice(0, 5);

        // 2. Fetch from Spotify
        const moodParams = {
            'morning': { target_energy: 0.4, target_valence: 0.6 },
            'workout': { min_tempo: 120, target_energy: 0.8 },
            'focus': { target_energy: 0.3, target_acousticness: 0.7 },
            'vibe': { target_popularity: 50 }
        };

        let recs = [];
        try {
            recs = await getRecommendations(
                session.accessToken,
                seedTrackIds.length > 0 ? seedTrackIds : ['4cOdK9sSTH1YyM9G9yYI92'],
                moodParams[mode] || {}
            );
        } catch (e) {
            console.error("AI API Spotify Error:", e.message);
            return NextResponse.json(FALLBACK_TRACKS);
        }

        const tracks = (recs || []).map(track => {
            if (!track) return null;
            return {
                id: track.id,
                name: track.name || "Unknown Track",
                artists: track.artists || [{ name: "Unknown Artist" }],
                album: track.album || { name: "Unknown Album", images: [] },
                popularity: track.popularity || 0,
                track_id: track.id
            };
        }).filter(Boolean);

        if (tracks.length === 0) return NextResponse.json(FALLBACK_TRACKS);

        return NextResponse.json(tracks);
    } catch (error) {
        console.error("AI Recommendations Critical Failure:", error);
        return NextResponse.json(FALLBACK_TRACKS);
    }
}
