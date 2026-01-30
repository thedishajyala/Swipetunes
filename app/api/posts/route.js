import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { track_id, caption, hashtags } = await request.json();

    try {
        const { data, error } = await supabaseAdmin
            .from('posts')
            .insert({
                user_id: userId,
                track_id,
                caption,
                hashtags
            })
            .select()
            .single();

        if (error) throw error;

        // Reward XP for posting
        fetch(`${process.env.NEXTAUTH_URL}/api/gamification`, {
            method: 'POST',
            body: JSON.stringify({ action: 'share_track' }) // Reusing share XP
        });

        // Add to journal
        fetch(`${process.env.NEXTAUTH_URL}/api/journal`, {
            method: 'POST',
            body: JSON.stringify({ track_id, action: 'shared' })
        });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { data: posts, error } = await supabaseAdmin
            .from('posts')
            .select('*, users(display_name, profile_pic_url)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        // Fetch track details for each post
        const detailedPosts = await Promise.all(
            posts.map(async (p) => {
                const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${p.track_id}`, {
                    headers: { 'Authorization': `Bearer ${session.accessToken}` }
                });
                const track = await trackRes.json();
                return { ...p, track };
            })
        );

        return NextResponse.json(detailedPosts);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
