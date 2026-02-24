import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { track_id, mood } = await req.json();
        if (!track_id) return NextResponse.json({ error: "track_id required" }, { status: 400 });

        const lookupId = session.user.spotify_id || session.user.id;
        const { data: profile } = await supabase
            .from("users").select("id").eq("spotify_id", lookupId).maybeSingle();
        const internalId = profile ? profile.id : session.user.id;

        const { error } = await supabase
            .from("likes")
            .update({ mood: mood || null })
            .eq("user_id", internalId)
            .eq("track_id", track_id);

        if (error) {
            console.error("Mood update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, track_id, mood });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
