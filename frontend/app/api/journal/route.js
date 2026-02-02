import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { track_id, action } = await request.json();

    try {
        const { data, error } = await supabaseAdmin
            .from('music_journal')
            .insert({
                user_id: userId,
                track_id,
                action
            })
            .select()
            .single();

        if (error) throw error;

        // Trigger Challenge Progress tracking
        fetch(`${process.env.NEXTAUTH_URL}/api/challenges`, {
            method: 'POST',
            body: JSON.stringify({ action })
        }).catch(err => console.error("Challenge trigger error:", err));

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    try {
        const { data, error } = await supabaseAdmin
            .from('music_journal')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
