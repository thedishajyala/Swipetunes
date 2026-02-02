const supabase = require('../lib/supabase');

async function resolveUserId(spotifyId) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(spotifyId)) return spotifyId;
    const { data } = await supabase.from('users').select('id').eq('spotify_id', spotifyId).maybeSingle();
    return data ? data.id : null;
}

const followUser = async (req, res, next) => {
    try {
        const { followerId, followingId } = req.body;
        const rFollower = await resolveUserId(followerId) || followerId;
        const rFollowing = await resolveUserId(followingId) || followingId;

        const { error } = await supabase.from('follows').insert({
            follower_id: rFollower,
            following_id: rFollowing
        });

        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
};

const getFollowers = async (req, res, next) => {
    try {
        const userId = await resolveUserId(req.params.id);
        const { data } = await supabase.from('follows')
            .select('follower_id, users!follows_follower_id_fkey(*)')
            .eq('following_id', userId);
        res.json(data);
    } catch (e) { next(e); }
};

const getFollowing = async (req, res, next) => {
    try {
        const userId = await resolveUserId(req.params.id);
        const { data } = await supabase.from('follows')
            .select('following_id, users!follows_following_id_fkey(*)')
            .eq('follower_id', userId);
        res.json(data);
    } catch (e) { next(e); }
};

const getTasteMatch = async (req, res, next) => {
    try {
        const { me, other } = req.query;
        const myId = await resolveUserId(me);
        const otherId = await resolveUserId(other);

        if (!myId || !otherId) return res.json({ match: 0 });

        const { data: myLikes } = await supabase.from('likes').select('track_id').eq('user_id', myId);
        const { data: otherLikes } = await supabase.from('likes').select('track_id').eq('user_id', otherId);

        const mySet = new Set(myLikes.map(l => l.track_id));
        const otherSet = new Set(otherLikes.map(l => l.track_id));

        const intersection = new Set([...mySet].filter(x => otherSet.has(x)));
        const union = new Set([...mySet, ...otherSet]);

        const match = union.size === 0 ? 0 : Math.round((intersection.size / union.size) * 100);
        res.json({ match, common: intersection.size, total: union.size });
    } catch (e) { next(e); }
};

module.exports = { followUser, getFollowers, getFollowing, getTasteMatch };
