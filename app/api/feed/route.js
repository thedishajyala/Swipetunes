import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // 1. Get IDs of friends (accepted followers/following)
        const { data: colleagues, error: colleaguesError } = await supabaseAdmin
            .from('followers')
            .select('user_id, friend_id')
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
            .eq('status', 'accepted');

        if (colleaguesError) throw colleaguesError;

        const friendIds = colleagues.map(c => c.user_id === userId ? c.friend_id : c.user_id);

        if (friendIds.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Fetch tracks shared in messages to/from friends
        const { data: sharedMessages } = await supabaseAdmin
            .from('messages')
            .select('track_shared')
            .not('track_shared', 'is', null)
            .or(`sender_id.in.(${friendIds.join(',')}),receiver_id.eq.${userId}`);

        const sharedTrackIds = sharedMessages?.map(m => m.track_shared).filter(Boolean) || [];

        // 3. Fetch songs liked by friends OR shared in messages
        let query = supabaseAdmin
            .from('songs')
            .select(`
                *,
                likers:users!inner(display_name, profile_pic_url)
            `);

        if (sharedTrackIds.length > 0) {
            query = query.or(`liked_by.overlaps.{${friendIds.join(',')}},track_id.in.(${sharedTrackIds.join(',')})`);
        } else {
            query = query.overlaps('liked_by', friendIds);
        }

        const { data: songs, error: songsError } = await query
            .order('created_at', { ascending: false })
            .limit(30);

        // 4. Fetch Trending Tracks (Global popularity in Swipetunes)
        const { data: trending } = await supabaseAdmin
            .from('songs')
            .select('*')
            .not('liked_by', 'is', null)
            .limit(10);

        // Sort trending by length of liked_by array
        const sortedTrending = trending?.sort((a, b) => (b.liked_by?.length || 0) - (a.liked_by?.length || 0)) || [];

        // 5. Fetch User Status Posts from friends and self
        const allRelevantUserIds = [...new Set([...friendIds, userId])];
        const { data: userPosts, error: userPostsError } = await supabaseAdmin
            .from('user_posts')
            .select(`
                *,
                users(display_name, profile_pic_url)
            `)
            .in('user_id', allRelevantUserIds)
            .order('created_at', { ascending: false })
            .limit(20); // Limit for user posts

        if (songsError) {
            // Fallback strategy if the inner join is too strict or complex for current setup
            const { data: plainSongs, error: plainError } = await supabaseAdmin
                .from('songs')
                .select('*')
                .overlaps('liked_by', friendIds)
                .order('created_at', { ascending: false })
                .limit(30); // Changed from 50 to 30

            if (plainError) throw plainError;
            return NextResponse.json(plainSongs);
        }

        return NextResponse.json(songs);
    } catch (error) {
        console.error("API Feed Error:", error);
        return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
    }
}
