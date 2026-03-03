const supabase = require('../lib/supabase');
const { resolveUserId } = require('../lib/resolveUserId');

/** GET /users — Returns all users (excluding self based on optional ?exclude=spotifyId) */
const getAllUsers = async (req, res, next) => {
    try {
        const { exclude, q } = req.query;
        let query = supabase
            .from('users')
            .select('id, display_name, profile_pic_url, spotify_id, city, xp, level');

        if (q) {
            query = query.ilike('display_name', `%${q}%`);
        }

        if (exclude) {
            const excludeId = await resolveUserId(exclude);
            if (excludeId) query = query.neq('id', excludeId);
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;
        res.json(data || []);
    } catch (e) { next(e); }
};

/** GET /users/:id — Returns a single user profile by UUID or Spotify ID */
const getUserProfile = async (req, res, next) => {
    try {
        const userId = await resolveUserId(req.params.id);
        if (!userId) return res.status(404).json({ error: 'User not found' });

        const { data, error } = await supabase
            .from('users')
            .select('id, display_name, profile_pic_url, spotify_id, city, xp, level, created_at')
            .eq('id', userId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'User not found' });
        res.json(data);
    } catch (e) { next(e); }
};

module.exports = { getAllUsers, getUserProfile };
