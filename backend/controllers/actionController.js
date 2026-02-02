const supabase = require('../lib/supabase');
const { z } = require('zod');

// Schema for Swipe Action
const actionSchema = z.object({
    spotifyId: z.string(),
    songId: z.string(),
    songName: z.string(),
    artist: z.string(),
    action: z.enum(['like', 'swipe', 'nope']),
    image: z.string().optional()
});

// Helper
async function resolveUserId(spotifyId) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(spotifyId)) {
        return spotifyId;
    }
    const { data } = await supabase.from('users').select('id').eq('spotify_id', spotifyId).maybeSingle();
    return data ? data.id : null;
}

const handleAction = async (req, res, next) => {
    try {
        const { spotifyId, songId, songName, artist, action, image } = req.body;

        let userId = await resolveUserId(spotifyId);
        // If not found, we use spotifyId strictly for logging, but logic requiring UUID will be skipped/safe guarded

        console.log(`[ACTION] ${action.toUpperCase()} - ${songName} (${userId})`);

        // 1. Upsert Song
        await supabase.from('songs').upsert({
            track_id: songId,
            title: songName,
            artist: artist,
            cover_url: image
        }, { onConflict: 'track_id' });

        if (action === 'like') {
            if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
                // A. Like
                await supabase.from('likes').upsert({ user_id: userId, track_id: songId });

                // B. Daily Playlist
                const today = new Date().toISOString().split('T')[0];
                const playlistTitle = `Daily Vibe - ${new Date().toLocaleDateString()}`;

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

                if (playlistId) {
                    await supabase.from('playlist_tracks').insert({
                        playlist_id: playlistId,
                        track_id: songId,
                        track_name: songName,
                        artist: artist,
                        cover_url: image
                    });
                }

                return res.json({ success: true, message: "Liked & Added to Daily Playlist" });
            }
            return res.json({ success: true, warning: 'User UUID not found, only song saved' });
        }

        res.json({ success: true, message: "Swipe recorded" });

    } catch (error) {
        next(error);
    }
};

module.exports = { handleAction, actionSchema };
