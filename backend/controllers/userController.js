const supabase = require('../lib/supabase');

const getAllUsers = async (req, res, next) => {
    try {
        const { data } = await supabase.from('users').select('*');
        res.json(data || []);
    } catch (e) { next(e); }
};

module.exports = { getAllUsers };
