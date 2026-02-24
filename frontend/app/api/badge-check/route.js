import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// All badges defined in code — no DB seeding needed
const BADGES = [
    { id: "first_like", emoji: "💿", name: "First Play", desc: "Liked your first song", check: (s) => s.likes >= 1 },
    { id: "likes_10", emoji: "🎵", name: "Tuneful", desc: "Liked 10 songs", check: (s) => s.likes >= 10 },
    { id: "likes_50", emoji: "🎸", name: "Music Lover", desc: "Liked 50 songs", check: (s) => s.likes >= 50 },
    { id: "likes_100", emoji: "💯", name: "Century Club", desc: "Liked 100 songs", check: (s) => s.likes >= 100 },
    { id: "likes_500", emoji: "🏆", name: "Legend", desc: "Liked 500 songs", check: (s) => s.likes >= 500 },
    { id: "streak_3", emoji: "🔥", name: "On Fire", desc: "3-day swipe streak", check: (s) => (s.streak_count || 0) >= 3 },
    { id: "streak_7", emoji: "⚡", name: "Week Warrior", desc: "7-day swipe streak", check: (s) => (s.streak_count || 0) >= 7 },
    { id: "streak_30", emoji: "🌟", name: "Monthly Master", desc: "30-day swipe streak", check: (s) => (s.streak_count || 0) >= 30 },
    { id: "level_5", emoji: "🚀", name: "Rising Star", desc: "Reached Level 5", check: (s) => (s.level || 1) >= 5 },
    { id: "level_10", emoji: "👑", name: "SwipeTunes Royalty", desc: "Reached Level 10", check: (s) => (s.level || 1) >= 10 },
    { id: "genre_explorer", emoji: "🌍", name: "Genre Explorer", desc: "Mooded 5+ different songs", check: (s) => (s.moods || 0) >= 5 },
    { id: "night_owl", emoji: "🦉", name: "Night Owl", desc: "Liked a song after midnight", check: (s) => s.night_like === true },
];

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    try {
        // 1. Gather user stats from multiple sources
        const [statsRes, likesRes, moodRes, nightRes] = await Promise.all([
            supabaseAdmin.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
            supabaseAdmin.from("likes").select("*", { count: "exact", head: true }).eq("user_id", userId),
            supabaseAdmin.from("likes").select("mood").eq("user_id", userId).not("mood", "is", null),
            supabaseAdmin.from("likes").select("created_at").eq("user_id", userId),
        ]);

        const userStats = statsRes.data || {};
        const likeCount = likesRes.count || 0;
        const uniqueMoods = new Set((moodRes.data || []).map(r => r.mood)).size;
        const nightLike = (nightRes.data || []).some(r => {
            const h = new Date(r.created_at).getHours();
            return h >= 0 && h < 5;
        });

        const checkInput = {
            likes: likeCount,
            streak_count: userStats.streak_count || 0,
            level: userStats.level || 1,
            moods: uniqueMoods,
            night_like: nightLike,
        };

        // 2. Load existing user achievements
        const { data: existingRaw } = await supabaseAdmin
            .from("user_achievements")
            .select("badge_id")
            .eq("user_id", userId);
        const existing = new Set((existingRaw || []).map(r => r.badge_id));

        // 3. Award new badges
        const newlyAwarded = [];
        for (const badge of BADGES) {
            if (!existing.has(badge.id) && badge.check(checkInput)) {
                await supabaseAdmin.from("user_achievements").insert({
                    user_id: userId,
                    badge_id: badge.id,
                    awarded_at: new Date().toISOString(),
                });
                newlyAwarded.push(badge);
            }
        }

        return NextResponse.json({ newlyAwarded, total: existing.size + newlyAwarded.length });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET — return all badges with earned status for display
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { data: earned } = await supabaseAdmin
        .from("user_achievements")
        .select("badge_id, awarded_at")
        .eq("user_id", userId);

    const earnedMap = {};
    (earned || []).forEach(r => { earnedMap[r.badge_id] = r.awarded_at; });

    const result = BADGES.map(b => ({
        ...b,
        earned: !!earnedMap[b.id],
        awarded_at: earnedMap[b.id] || null,
    }));

    return NextResponse.json(result);
}
