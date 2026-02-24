import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "week"; // week | month | alltime

        let since = null;
        if (period === "week") {
            since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (period === "month") {
            since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        // Count likes per user in the period
        let query = supabase
            .from("likes")
            .select("user_id, users(display_name, profile_pic_url)", { count: "exact" });

        if (since) query = query.gte("created_at", since);

        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Aggregate counts
        const counts = {};
        const meta = {};
        (data || []).forEach(row => {
            const id = row.user_id;
            if (!id) return;
            counts[id] = (counts[id] || 0) + 1;
            if (!meta[id] && row.users) meta[id] = row.users;
        });

        const board = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 25)
            .map(([user_id, likes], i) => ({
                rank: i + 1,
                user_id,
                likes,
                display_name: meta[user_id]?.display_name || "Anonymous",
                avatar: meta[user_id]?.profile_pic_url || null,
            }));

        return NextResponse.json(board);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
