const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Fetch top tracks for the authenticated user
 * @param {string} accessToken 
 * @param {string} timeRange - 'short_term', 'medium_term', 'long_term'
 * @param {number} limit 
 * @returns {Promise<Object>}
 */
export async function getTopTracks(accessToken, timeRange = 'medium_term', limit = 20) {
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
