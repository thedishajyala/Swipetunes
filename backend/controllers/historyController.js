const supabase = require('../lib/supabase');
const { resolveUserId } = require('../lib/resolveUserId');

/**
 * GET /history/:id
 * Returns liked songs for a user, most recent first.
 * :id can be a Spotify ID or internal UUID.
 */
const getHistory = async (req, res, next) => {
    try {
        const userId = await resolveUserId(req.params.id);
        if (!userId) return res.json([]);

        const { data, error } = await supabase
            .from('likes')
            .select('track_id, created_at, songs(title, artist, cover_url)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json(data || []);
    } catch (e) { next(e); }
};

/**
 * GET /history/:id/swipes
 * Returns all swipe actions (liked + noped) for a user.
 */
const getSwipeHistory = async (req, res, next) => {
    try {
        const userId = await resolveUserId(req.params.id);
        if (!userId) return res.json([]);

        const { data, error } = await supabase
            .from('swipes')
            .select('track_id, liked, created_at, songs(title, artist, cover_url)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json(data || []);
    } catch (e) { next(e); }
};

module.exports = { getHistory, getSwipeHistory };
