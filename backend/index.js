const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Connection
// Initialize the Supabase client with the Service Role Key for backend access
// WARNING: Service Role Key bypasses Row Level Security (RLS). Use with caution and validate inputs.
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

console.log("✅ Supabase client initialized");

// Routes

// Test Route
app.get("/", (req, res) => {
    res.send("SwipeTunes Backend (Supabase) is running 🚀");
});

// Save Action (Swipe/Like)
app.post("/action", async (req, res) => {
    try {
        const { spotifyId, songId, songName, artist, action, image } = req.body;

        // Validate required fields
        if (!spotifyId || !songId || !action) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Resolve internal user_id from spotifyId
        let userId = null;
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('spotify_id', spotifyId)
                .maybeSingle();

            if (error) {
                // If error is UUID related, we just ignore and say user not found
                if (!error.message.includes('invalid input syntax')) throw error;
            }
            if (data) userId = data.id;
        } catch (err) {
            console.warn(`User lookup failed for ${spotifyId}: ${err.message}`);
            // Proceed with userId = null
        }

        console.log(`[${action.toUpperCase()}] ${songName} by ${artist} for user ${userId || 'UNKNOWN'} (${spotifyId})`);

        // 1. Upsert Song Data
        const { error: songError } = await supabase.from('songs').upsert({
            track_id: songId,
            title: songName,
            artist: artist,
            cover_url: image, // Use image as cover_url
        }, { onConflict: 'track_id' });

        if (songError) console.error("Error upserting song:", songError);


        // 2. Record Action (Like/Swipe)
        if (action === 'like') {
            if (userId) {
                const { error: likeError } = await supabase.from('likes').upsert({
                    user_id: userId,
                    track_id: songId
                });
                if (likeError) throw likeError;
                res.json({ message: "Liked successfully", success: true });
            } else {
                res.json({ message: "Song saved, but user not found/invalid so like not linked", success: true, warning: "User not found" });
            }
        } else {
            res.json({ message: "Swipe recorded", success: true });
        }

    } catch (error) {
        console.error("Error saving action:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Get User History (Likes)
app.get("/history/:spotifyId", async (req, res) => {
    try {
        const { spotifyId } = req.params;

        // Resolve internal user_id
        let userId = null;
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('spotify_id', spotifyId)
                .maybeSingle();

            if (data) userId = data.id;
        } catch (err) {
            console.warn(`History lookup user failed: ${err.message}`);
        }

        // If no user found (or UUID mismatch), we can't fetch database history linked to UUID.
        // We return empty array.
        if (!userId) {
            return res.json([]);
        }

        // Fetch likes for this user
        const { data: likes, error: likesError } = await supabase
            .from('likes')
            .select('track_id, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (likesError) throw likesError;

        if (!likes || likes.length === 0) {
            return res.json([]);
        }

        const trackIds = likes.map(l => l.track_id);

        // Fetch song details
        const { data: songs, error: songsError } = await supabase
            .from('songs')
            .select('*')
            .in('track_id', trackIds);

        if (songsError) throw songsError;

        const history = likes.map(like => {
            const song = songs.find(s => s.track_id === like.track_id);
            if (!song) return null;
            return {
                songId: song.track_id,
                songName: song.title,
                artist: song.artist,
                image: song.cover_url,
                timestamp: like.created_at
            };
        }).filter(Boolean);

        res.json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
