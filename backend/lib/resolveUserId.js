const supabase = require('./supabase');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves a Spotify ID or UUID to a Supabase internal UUID.
 * If the input is already a UUID, it is returned directly.
 * Otherwise, looks up the user by spotify_id.
 */
async function resolveUserId(spotifyIdOrUUID) {
    if (!spotifyIdOrUUID) return null;
    if (UUID_REGEX.test(spotifyIdOrUUID)) return spotifyIdOrUUID;
    const { data } = await supabase
        .from('users')
        .select('id')
        .eq('spotify_id', spotifyIdOrUUID)
        .maybeSingle();
    return data ? data.id : null;
}

module.exports = { resolveUserId, UUID_REGEX };
