const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Fetch top tracks for the authenticated user
 * @param {string} accessToken 
 * @param {string} timeRange - 'short_term', 'medium_term', 'long_term'
 * @param {number} limit 
 * @returns {Promise<Object>}
 */
export async function getTopTracks(accessToken, timeRange = 'medium_term', limit = 50) {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/top/tracks?time_range=${timeRange}&limit=${limit}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch top tracks: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch top artists for the authenticated user
 * @param {string} accessToken 
 * @param {string} timeRange 
 * @param {number} limit 
 * @returns {Promise<Object>}
 */
export async function getTopArtists(accessToken, timeRange = 'medium_term', limit = 20) {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/top/artists?time_range=${timeRange}&limit=${limit}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch top artists: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch recently played tracks
 * @param {string} accessToken 
 * @param {number} limit 
 * @returns {Promise<Object>}
 */
export async function getRecentlyPlayed(accessToken, limit = 20) {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/recently-played?limit=${limit}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        // recently-played might return 204 if no history
        if (response.status === 204) return { items: [] };
        throw new Error(`Failed to fetch recently played: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch user profile
 * @param {string} accessToken
 * @returns {Promise<Object>} 
 */
export async function getUserProfile(accessToken) {
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch currently playing track
 * @param {string} accessToken
 * @returns {Promise<Object>}
 */
export async function getCurrentlyPlaying(accessToken) {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (response.status === 204 || response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch currently playing: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch audio features for a list of tracks
 * @param {string} accessToken
 * @param {string[]} ids - Array of Spotify track IDs
 * @returns {Promise<Object>}
 */
export async function getAudioFeatures(accessToken, ids) {
    const response = await fetch(`${SPOTIFY_API_BASE}/audio-features?ids=${ids.join(',')}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch audio features: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch track details
 * @param {string} accessToken
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getTrack(accessToken, id) {
    const response = await fetch(`${SPOTIFY_API_BASE}/tracks/${id}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch track: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch recommendations based on seeds
 * @param {string} accessToken
 * @param {string[]} seedTracks
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function getRecommendations(accessToken, seedTracks, options = {}) {
    const params = new URLSearchParams({
        seed_tracks: seedTracks.join(','),
        ...options
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/recommendations?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tracks;
}
