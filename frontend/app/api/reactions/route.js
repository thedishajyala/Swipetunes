import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { track_id, emoji } = await request.json();

    try {
        const { error } = await supabaseAdmin
            .from('reactions')
            .upsert({
                user_id: userId,
                track_id,
                emoji
            }, { onConflict: 'user_id,track_id,emoji' });

        if (error) throw error;

        // Reward small XP for reacting
        await fetch(`${process.env.NEXTAUTH_URL}/api/gamification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_comment' }) // Similar reward level
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');

    if (!trackId) return NextResponse.json({ error: "Track ID required" }, { status: 400 });

    try {
        const { data, error } = await supabaseAdmin
            .from('reactions')
            .select('emoji, user_id')
            .eq('track_id', trackId);

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
