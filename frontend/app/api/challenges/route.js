import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    try {
        // 1. Fetch all active challenges
        const { data: challenges, error: challengesError } = await supabaseAdmin
            .from('challenges')
            .select('*');

        if (challengesError) throw challengesError;

        // 2. Fetch user progress for these challenges
        const { data: progress, error: progressError } = await supabaseAdmin
            .from('user_challenge_progress')
            .select('*')
            .eq('user_id', userId);

        if (progressError) throw progressError;

        // 3. Merge data
        const merged = challenges.map(c => {
            const up = progress.find(p => p.challenge_id === c.id);
            return {
                ...c,
                progress: up ? up.progress : 0,
                is_completed: up ? up.is_completed : false
            };
        });

        return NextResponse.json(merged);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST to update progress manually or trigger check (usually triggered by journal event)
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { action } = await request.json(); // e.g., 'liked', 'shared', 'reacted'

    try {
        // Find challenges matching this action type
        const { data: activeChallenges } = await supabaseAdmin
            .from('challenges')
            .select('*')
            .eq('type', action);

        for (const challenge of activeChallenges) {
            // Upsert progress
            const { data: currentProgress } = await supabaseAdmin
                .from('user_challenge_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('challenge_id', challenge.id)
                .maybeSingle();

            const newProgress = (currentProgress?.progress || 0) + 1;
            const isCompleted = newProgress >= challenge.target;

            await supabaseAdmin
                .from('user_challenge_progress')
                .upsert({
                    user_id: userId,
                    challenge_id: challenge.id,
                    progress: newProgress,
                    is_completed: isCompleted
                });

            // If just completed, award XP
            if (isCompleted && !currentProgress?.is_completed) {
                await fetch(`${process.env.NEXTAUTH_URL}/api/gamification`, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'challenge_complete', challenge_id: challenge.id })
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
