const supabase = require('../lib/supabase');
const { resolveUserId } = require('../lib/resolveUserId');

const followUser = async (req, res, next) => {
    try {
        const { followerId, followingId } = req.body;
        const rFollower = await resolveUserId(followerId) || followerId;
        const rFollowing = await resolveUserId(followingId) || followingId;

        // Use the 'followers' table from the master schema (user_id/friend_id)
        // We treat the person doing the following as user_id, and the target as friend_id
        const { error } = await supabase.from('followers').upsert({
            user_id: rFollower,
            friend_id: rFollowing,
            status: 'accepted'
        }, { onConflict: 'user_id,friend_id' });

        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
};

const unfollowUser = async (req, res, next) => {
    try {
        const { followerId, followingId } = req.body;
        const rFollower = await resolveUserId(followerId) || followerId;
        const rFollowing = await resolveUserId(followingId) || followingId;

        const { error } = await supabase.from('followers')
            .delete()
            .eq('user_id', rFollower)
            .eq('friend_id', rFollowing);

        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
};

const getFollowers = async (req, res, next) => {
    try {
        const userId = await resolveUserId(req.params.id);
        if (!userId) return res.json([]);
        // People who follow userId: friend_id = userId
        const { data } = await supabase.from('followers')
            .select('user_id, users!followers_user_id_fkey(id, display_name, profile_pic_url, spotify_id)')
            .eq('friend_id', userId)
            .eq('status', 'accepted');
        res.json(data || []);
    } catch (e) { next(e); }
};

const getFollowing = async (req, res, next) => {
    try {
        const userId = await resolveUserId(req.params.id);
        if (!userId) return res.json([]);
        // People userId follows: user_id = userId
        const { data } = await supabase.from('followers')
            .select('friend_id, users!followers_friend_id_fkey(id, display_name, profile_pic_url, spotify_id)')
            .eq('user_id', userId)
            .eq('status', 'accepted');
        res.json(data || []);
    } catch (e) { next(e); }
};

const getTasteMatch = async (req, res, next) => {
    try {
        const { me, other } = req.query;
        const myId = await resolveUserId(me);
        const otherId = await resolveUserId(other);

        if (!myId || !otherId) return res.json({ match: 0, common: 0, total: 0 });

        const { data: myLikes } = await supabase.from('likes').select('track_id').eq('user_id', myId);
        const { data: otherLikes } = await supabase.from('likes').select('track_id').eq('user_id', otherId);

        const mySet = new Set((myLikes || []).map(l => l.track_id));
        const otherSet = new Set((otherLikes || []).map(l => l.track_id));

        const intersection = new Set([...mySet].filter(x => otherSet.has(x)));
        const union = new Set([...mySet, ...otherSet]);

        const match = union.size === 0 ? 0 : Math.round((intersection.size / union.size) * 100);
        res.json({ match, common: intersection.size, total: union.size });
    } catch (e) { next(e); }
};

module.exports = { followUser, unfollowUser, getFollowers, getFollowing, getTasteMatch };
