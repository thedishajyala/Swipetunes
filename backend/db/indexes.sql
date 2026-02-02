-- Database Performance Indexes for SwipeTunes

-- 1. Optimize Playlist Lookups (Used in "Daily Playlist" availability check)
CREATE INDEX IF NOT EXISTS idx_playlists_user_date ON playlists(user_id, date);

-- 2. Optimize Trending Calculations (Aggregation on views)
CREATE INDEX IF NOT EXISTS idx_playlist_views_playlist ON playlist_views(playlist_id);

-- 3. Optimize Playlist Track Retrieval (Fetching songs for a playlist)
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);

-- 4. Optimize History Fetching (Likes by user)
CREATE INDEX IF NOT EXISTS idx_likes_user_created ON likes(user_id, created_at DESC);
