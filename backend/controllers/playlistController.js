const supabase = require('../lib/supabase');
const { resolveUserId } = require('../lib/resolveUserId');

const getTodayPlaylist = async (req, res, next) => {
    try {
        const userId = await resolveUserId(req.params.id);
        if (!userId) return res.json(null);

        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase.from('playlists')
            .select('*, playlist_tracks(*)')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle();

        res.json(data || null);
    } catch (e) { next(e); }
};

const getUserPlaylists = async (req, res, next) => {
    try {
        const userId = await resolveUserId(req.params.id);
        if (!userId) return res.json([]);

        const { data } = await supabase.from('playlists')
            .select('*, playlist_tracks(*)')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        res.json(data || []);
    } catch (e) { next(e); }
};

const viewPlaylist = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { viewerId } = req.query;

        const { data } = await supabase.from('playlists')
            .select('*, playlist_tracks(*)')
            .eq('id', id)
            .single();

        if (data) {
            supabase.from('playlist_views').insert({
                playlist_id: id,
                viewer_id: viewerId || null
            }).catch(console.error);
        }
        res.json(data);
    } catch (e) { next(e); }
};

const getTrending = async (req, res, next) => {
    try {
        // Fetch the 20 most recently created playlists, joining creator info
        const { data } = await supabase.from('playlists')
            .select('*, users(display_name, profile_pic_url, spotify_id)')
            .order('created_at', { ascending: false })
            .limit(20);
        res.json(data || []);
    } catch (e) { next(e); }
};

module.exports = { getTodayPlaylist, getUserPlaylists, viewPlaylist, getTrending };
