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
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

console.log("✅ Supabase client initialized");

// --- HELPER: Resolve User UUID ---
async function resolveUserId(spotifyId) {
    // If it looks like a UUID, return it (naive check)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(spotifyId)) {
        return spotifyId;
    }
    const { data } = await supabase.from('users').select('id').eq('spotify_id', spotifyId).maybeSingle();
    return data ? data.id : null;
}

// Routes

app.get("/", (req, res) => {
    res.send("SwipeTunes Backend (Social Edition) is running 🚀");
});

// ---------------------------------------------------------
// STEP 2: MODIFIED SWIPE LOGIC (Daily Playlists)
// ---------------------------------------------------------
app.post("/action", async (req, res) => {
    try {
        const { spotifyId, songId, songName, artist, action, image } = req.body;

        if (!spotifyId || !songId || !action) return res.status(400).json({ error: "Missing fields" });

        let userId = await resolveUserId(spotifyId);
        if (!userId) userId = spotifyId; // Fallback for error logging, but operations needing UUID will fail/skip

        console.log(`[${action.toUpperCase()}] ${songName} for user ${userId || 'UNKNOWN'}`);

        // 1. Upsert Song
        await supabase.from('songs').upsert({
            track_id: songId,
            title: songName,
            artist: artist,
            cover_url: image,
        }, { onConflict: 'track_id' });

        // 2. Handle Like
        if (action === 'like') {
            if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {

                // A. Insert into Likes
                await supabase.from('likes').upsert({ user_id: userId, track_id: songId });

                // B. DAILY PLAYLIST LOGIC
                try {
                    const today = new Date().toISOString().split('T')[0];
                    const playlistTitle = `Daily Vibe - ${new Date().toLocaleDateString()}`;

                    // Find or Create Playlist for Today
                    let playlistId = null;
                    const { data: existing } = await supabase.from('playlists')
                        .select('id').eq('user_id', userId).eq('date', today).maybeSingle();

                    if (existing) {
                        playlistId = existing.id;
                    } else {
                        const { data: newPl } = await supabase.from('playlists')
                            .insert({ user_id: userId, date: today, title: playlistTitle })
                            .select('id').single();
                        if (newPl) playlistId = newPl.id;
                    }

                    // Insert Track into Playlist
                    if (playlistId) {
                        await supabase.from('playlist_tracks').insert({
                            playlist_id: playlistId,
                            track_id: songId,
                            track_name: songName,
                            artist: artist,
                            cover_url: image
                        });
                    }
                } catch (e) {
                    console.error("Daily Playlist Error:", e);
                }

                res.json({ success: true, message: "Liked & Added to Daily Playlist" });
            } else {
                res.json({ success: true, warning: "User UUID not found" });
            }
        } else {
            res.json({ success: true, message: "Swipe recorded" });
        }

    } catch (error) {
        console.error("Action Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ---------------------------------------------------------
// STEP 3: NEW APIs (Social & Playlists)
// ---------------------------------------------------------

// --- PLAYLIST APIs ---

// Get Today's Playlist
app.get("/playlist/today/:id", async (req, res) => {
    try {
        const userId = await resolveUserId(req.params.id);
        if (!userId) return res.json(null);

        const today = new Date().toISOString().split('T')[0];
        const { data: playlist } = await supabase.from('playlists')
            .select('*, playlist_tracks(*)')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle();

        res.json(playlist || null);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get User's Playlist History
app.get("/playlist/user/:id", async (req, res) => {
    try {
        const userId = await resolveUserId(req.params.id);
        if (!userId) return res.json([]);

        const { data: playlists } = await supabase.from('playlists')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        res.json(playlists || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// View a Playlist (and tracks)
app.get("/playlist/view/:id", async (req, res) => {
    try {
        const { id } = req.params; // playlist UUID
        const { viewerId } = req.query; // optional viewer

        const { data: playlist } = await supabase.from('playlists')
            .select('*, playlist_tracks(*)')
            .eq('id', id)
            .single();

        // Increment View Count (Async)
        if (playlist) {
            supabase.from('playlist_views').insert({
                playlist_id: id,
                viewer_id: viewerId || null // can be null
            }).then(({ error }) => { if (error) console.error("View log error", error) });
        }

        res.json(playlist);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- FOLLOW APIs ---

app.post("/follow", async (req, res) => {
    try {
        const { followerId, followingId } = req.body; // Expects UUIDs
        // Or resolve if passed as spotify IDs
        const rFollower = await resolveUserId(followerId) || followerId;
        const rFollowing = await resolveUserId(followingId) || followingId;

        const { error } = await supabase.from('follows').insert({
            follower_id: rFollower,
            following_id: rFollowing
        });

        if (error) throw error;
        res.json({ success: true, message: "Followed" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/following/:id", async (req, res) => {
    try {
        const userId = await resolveUserId(req.params.id);
        const { data } = await supabase.from('follows')
            .select('following_id, users!follows_following_id_fkey(*)') // Join to get user details
            .eq('follower_id', userId);
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/followers/:id", async (req, res) => {
    try {
        const userId = await resolveUserId(req.params.id);
        const { data } = await supabase.from('follows')
            .select('follower_id, users!follows_follower_id_fkey(*)')
            .eq('following_id', userId);
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- TRENDING API ---

app.get("/playlists/trending", async (req, res) => {
    try {
        // Complex query: get playlists with most views in last 24h
        // Supabase JS doesn't do aggregation easily without RPC.
        // Workaround: Get recent views, count locally, then fetch playlists.
        // Or just return latest playlists for MVP.

        // Better MVP approach: Get playlists created today/yesterday.
        const { data } = await supabase.from('playlists')
            .select('*, users(name, image, spotify_id)')
            .order('created_at', { ascending: false })
            .limit(20);

        // If we had a 'views' count on playlists table it would be easier.
        // For now, returning latest playlists is a good proxy for "Trending" in a small app.
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- TASTE MATCH API ---

app.get("/taste-match", async (req, res) => {
    try {
        const { me, other } = req.query;
        const myId = await resolveUserId(me);
        const otherId = await resolveUserId(other);

        if (!myId || !otherId) return res.json({ match: 0 });

        // Fetch likes for both
        const { data: myLikes } = await supabase.from('likes').select('track_id').eq('user_id', myId);
        const { data: otherLikes } = await supabase.from('likes').select('track_id').eq('user_id', otherId);

        const mySet = new Set(myLikes.map(l => l.track_id));
        const otherSet = new Set(otherLikes.map(l => l.track_id));

        // Intersection
        const intersection = new Set([...mySet].filter(x => otherSet.has(x)));
        const union = new Set([...mySet, ...otherSet]);

        const match = union.size === 0 ? 0 : Math.round((intersection.size / union.size) * 100);

        res.json({ match, common: intersection.size, total: union.size });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- OLD HISTORY API (Legacy Support) ---
app.get("/history/:spotifyId", async (req, res) => {
    // ... Copy of the previous history logic if needed, or redirect to use new User Playlist logic
    // Keeping it simple for now, using the same logic as before to not break existing frontend immediately
    try {
        const { spotifyId } = req.params;
        let userId = await resolveUserId(spotifyId);
        if (!userId) return res.json([]);

        const { data: likes } = await supabase.from('likes')
            .select('track_id, created_at').eq('user_id', userId).order('created_at', { ascending: false });

        if (!likes || !likes.length) return res.json([]);
        const trackIds = likes.map(l => l.track_id);
        const { data: songs } = await supabase.from('songs').select('*').in('track_id', trackIds);

        const history = likes.map(like => {
            const song = songs.find(s => s.track_id === like.track_id);
            if (!song) return null;
            return {
                songId: song.track_id, songName: song.title, artist: song.artist, image: song.cover_url, timestamp: like.created_at
            };
        }).filter(Boolean);
        res.json(history);
    } catch (error) { res.status(500).json({ error: error.message }); }
});


// --- USERS API ---
app.get("/users", async (req, res) => {
    try {
        const { data } = await supabase.from('users').select('*');
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
