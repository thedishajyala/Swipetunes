import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');
    const group_id = searchParams.get('groupId');
    const userId = session.user.id;

    if (!friendId && !group_id) {
        // Fetch list of recent chats (DMs)
        const { data: dmData } = await supabaseAdmin
            .from('messages')
            .select(`
                *,
                sender:users!sender_id(id, display_name, profile_pic_url),
                receiver:users!receiver_id(id, display_name, profile_pic_url)
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        // Fetch User's Groups
        const { data: groups } = await supabaseAdmin
            .from('group_members')
            .select('groups(*)')
            .eq('user_id', userId);

        return NextResponse.json({ dms: dmData, groups });
    }

    if (group_id) {
        const { data, error } = await supabaseAdmin
            .from('messages')
            .select(`
                *,
                sender:users!sender_id(id, display_name, profile_pic_url)
            `)
            .eq('group_id', group_id)
            .order('created_at', { ascending: true });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    // Fetch conversation with specific friend
    const { data, error } = await supabaseAdmin
        .from('messages')
        .select(`
            *,
            sender:users!sender_id(display_name, profile_pic_url),
            receiver:users!receiver_id(display_name, profile_pic_url)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark as read if user is receiver
    await supabaseAdmin
        .from('messages')
        .update({ read_status: true })
        .eq('receiver_id', userId)
        .eq('sender_id', friendId)
        .eq('read_status', false);

    return NextResponse.json(data);
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiver_id, group_id, message_text, track_shared } = await request.json();
    const sender_id = session.user.id;

    try {
        const payload = {
            sender_id,
            message_text,
            track_shared
        };
        if (receiver_id) payload.receiver_id = receiver_id;
        if (group_id) payload.group_id = group_id;

        const { data, error } = await supabaseAdmin
            .from('messages')
            .insert(payload)
            .select('*')
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
