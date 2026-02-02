import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const XP_MAP = {
    'swipe_like': 10,
    'share_track': 25,
    'add_comment': 15,
    'new_follower': 50,
    'daily_streak': 100
};

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action } = await request.json();
    const userId = session.user.id;
    const xpToAdd = XP_MAP[action] || 0;

    if (xpToAdd === 0) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    try {
        // 1. Get current stats
        const { data: stats, error: statsError } = await supabaseAdmin
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (statsError && statsError.code !== 'PGRST116') throw statsError;

        let newXp = (stats?.xp || 0) + xpToAdd;
        let newLevel = stats?.level || 1;

        // Simple level logic: Level up every 500 XP
        if (newXp >= newLevel * 500) {
            newLevel += 1;
        }

        // 2. Update or Insert stats
        const { error: updateError } = await supabaseAdmin
            .from('user_stats')
            .upsert({
                user_id: userId,
                xp: newXp,
                level: newLevel,
                last_activity: new Date().toISOString()
            });

        if (updateError) throw updateError;

        return NextResponse.json({ xpBalance: newXp, level: newLevel, added: xpToAdd });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    try {
        const { data: stats, error } = await supabaseAdmin
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Also fetch achievements
        const { data: achievements } = await supabaseAdmin
            .from('user_achievements')
            .select('achievements(*)')
            .eq('user_id', userId);

        return NextResponse.json({ stats: stats || { xp: 0, level: 1, streak_count: 0 }, achievements: achievements?.map(a => a.achievements) || [] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
