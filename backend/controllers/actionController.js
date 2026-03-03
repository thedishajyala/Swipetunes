const supabase = require('../lib/supabase');
const { resolveUserId, UUID_REGEX } = require('../lib/resolveUserId');
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

const handleAction = async (req, res, next) => {
    try {
        const { spotifyId, songId, songName, artist, action, image } = req.body;

        const userId = await resolveUserId(spotifyId);

        console.log(`[ACTION] ${action.toUpperCase()} - ${songName} (userId: ${userId || spotifyId})`);

        // 1. Upsert Song into catalog
        await supabase.from('songs').upsert({
            track_id: songId,
            title: songName,
            artist: artist,
            cover_url: image || null
        }, { onConflict: 'track_id' });

        const isValidUUID = userId && UUID_REGEX.test(userId);

        if (isValidUUID) {
            // 2. Record swipe (all actions: like, swipe/nope)
            await supabase.from('swipes').insert({
                user_id: userId,
                track_id: songId,
                liked: action === 'like'
            });

            if (action === 'like') {
                // 3. Upsert into likes table
                await supabase.from('likes').upsert(
                    { user_id: userId, track_id: songId },
                    { onConflict: 'user_id,track_id' }
                );

                // 4. Update songs.liked_by array (append userId if not already present)
                const { data: songRow } = await supabase
                    .from('songs')
                    .select('liked_by')
                    .eq('track_id', songId)
                    .maybeSingle();

                const likedBy = songRow?.liked_by || [];
                if (!likedBy.includes(userId)) {
                    await supabase.from('songs').update({
                        liked_by: [...likedBy, userId]
                    }).eq('track_id', songId);
                }

                // 5. Daily Playlist
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
                    // Avoid duplicate tracks in daily playlist
                    const { data: existingTrack } = await supabase.from('playlist_tracks')
                        .select('id')
                        .eq('playlist_id', playlistId)
                        .eq('track_id', songId)
                        .maybeSingle();

                    if (!existingTrack) {
                        await supabase.from('playlist_tracks').insert({
                            playlist_id: playlistId,
                            track_id: songId,
                            track_name: songName,
                            artist: artist,
                            cover_url: image || null
                        });
                    }
                }

                return res.json({ success: true, message: "Liked & Added to Daily Playlist" });
            }
        } else {
            // No valid UUID — still record the song, but skip user-specific inserts
            if (action === 'like') {
                return res.json({ success: true, warning: 'User UUID not found — song saved, likes/swipes skipped' });
            }
        }

        res.json({ success: true, message: "Swipe recorded" });

    } catch (error) {
        next(error);
    }
};

module.exports = { handleAction, actionSchema };
