import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = session.accessToken;
        const spotifyId = session.user.spotify_id || session.user.id;

        // 1. Get user's internal UUID from Supabase
        const { data: profile } = await supabase
            .from("users")
            .select("id")
            .eq("spotify_id", spotifyId)
            .maybeSingle();

        const internalId = profile ? profile.id : session.user.id;

        // 2. Fetch all liked track_ids from Supabase
        const { data: likes, error } = await supabase
            .from("likes")
            .select("track_id")
            .eq("user_id", internalId)
            .order("created_at", { ascending: false });

        if (error || !likes?.length) {
            return NextResponse.json({ error: "No liked songs found." }, { status: 404 });
        }

        const trackUris = likes.map(l => `spotify:track:${l.track_id}`);

        // 3. Get Spotify user profile to get their Spotify user ID
        const profileRes = await fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        const userId = profileData.id;

        if (!userId) {
            return NextResponse.json({ error: "Could not get Spotify user ID." }, { status: 500 });
        }

        // 4. Create a new Spotify playlist
        const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "SwipeTunes ❤️ Liked Songs",
                description: `${likes.length} songs you liked on SwipeTunes • Created ${new Date().toLocaleDateString()}`,
                public: false,
            }),
        });

        if (!createRes.ok) {
            const err = await createRes.json();
            return NextResponse.json({ error: "Failed to create playlist.", details: err }, { status: 500 });
        }

        const playlist = await createRes.json();
        const playlistId = playlist.id;
        const playlistUrl = playlist.external_urls?.spotify;

        // 5. Add tracks in batches of 100 (Spotify limit)
        const chunkSize = 100;
        for (let i = 0; i < trackUris.length; i += chunkSize) {
            const chunk = trackUris.slice(i, i + chunkSize);
            const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ uris: chunk }),
            });

            if (!addRes.ok) {
                console.error("Failed to add tracks batch:", await addRes.json());
            }
        }

        return NextResponse.json({
            success: true,
            playlistUrl,
            name: "SwipeTunes ❤️ Liked Songs",
            trackCount: likes.length,
        });

    } catch (err) {
        console.error("Export Playlist Error:", err);
        return NextResponse.json({ error: "Server error.", details: err.message }, { status: 500 });
    }
}
