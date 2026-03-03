-- ===========================================
-- SwipeTunes Migration 001
-- Adds all missing tables, columns, FK, indexes
-- ===========================================

-- ─── 1. user_stats ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id      uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    xp           integer DEFAULT 0,
    level        integer DEFAULT 1,
    streak_count integer DEFAULT 0,
    last_activity timestamp WITH time zone DEFAULT now()
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_stats' AND policyname='Allow All User Stats') THEN
    CREATE POLICY "Allow All User Stats" ON public.user_stats FOR ALL USING (true);
  END IF;
END $$;

-- ─── 2. user_achievements ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_achievements (
    user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id   text NOT NULL,
    awarded_at timestamp WITH time zone DEFAULT now(),
    PRIMARY KEY (user_id, badge_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_achievements' AND policyname='Allow All Achievements') THEN
    CREATE POLICY "Allow All Achievements" ON public.user_achievements FOR ALL USING (true);
  END IF;
END $$;

-- ─── 3. playlists ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.playlists (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date       date DEFAULT current_date NOT NULL,
    title      text NOT NULL,
    created_at timestamp WITH time zone DEFAULT now(),
    UNIQUE (user_id, date)
);
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='playlists' AND policyname='Allow All Playlists') THEN
    CREATE POLICY "Allow All Playlists" ON public.playlists FOR ALL USING (true);
  END IF;
END $$;

-- ─── 4. playlist_tracks ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id uuid REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
    track_id    text NOT NULL,
    track_name  text NOT NULL,
    artist      text,
    cover_url   text,
    preview_url text,
    added_at    timestamp WITH time zone DEFAULT now()
);
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='playlist_tracks' AND policyname='Allow All Playlist Tracks') THEN
    CREATE POLICY "Allow All Playlist Tracks" ON public.playlist_tracks FOR ALL USING (true);
  END IF;
END $$;

-- ─── 5. playlist_views ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.playlist_views (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id uuid REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
    viewer_id   uuid REFERENCES public.users(id),
    viewed_at   timestamp WITH time zone DEFAULT now()
);
ALTER TABLE public.playlist_views ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='playlist_views' AND policyname='Allow All Playlist Views') THEN
    CREATE POLICY "Allow All Playlist Views" ON public.playlist_views FOR ALL USING (true);
  END IF;
END $$;

-- ─── 6. reactions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reactions (
    user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE,
    track_id   text NOT NULL,
    emoji      text NOT NULL,
    created_at timestamp WITH time zone DEFAULT now(),
    PRIMARY KEY (user_id, track_id, emoji)
);
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reactions' AND policyname='Allow All Reactions') THEN
    CREATE POLICY "Allow All Reactions" ON public.reactions FOR ALL USING (true);
  END IF;
END $$;

-- ─── 7. likes.mood column ────────────────────────────────────────────────────
ALTER TABLE public.likes
    ADD COLUMN IF NOT EXISTS mood text DEFAULT NULL;

-- ─── 8. messages.group_id column ─────────────────────────────────────────────
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE;

-- ─── 9. songs.preview_url column ─────────────────────────────────────────────
ALTER TABLE public.songs
    ADD COLUMN IF NOT EXISTS preview_url text DEFAULT NULL;

-- ─── 10. FK: likes.track_id → songs(track_id) ────────────────────────────────
-- Only add if songs table has data and constraint doesn't already exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'likes_track_id_fkey'
    AND table_name = 'likes'
  ) THEN
    ALTER TABLE public.likes
      ADD CONSTRAINT likes_track_id_fkey
      FOREIGN KEY (track_id) REFERENCES public.songs(track_id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─── 11. Performance indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_playlists_user_date       ON public.playlists(user_id, date);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist  ON public.playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_views_playlist   ON public.playlist_views(playlist_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_created        ON public.likes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swipes_user_created       ON public.swipes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_liked_by            ON public.songs USING GIN(liked_by);
CREATE INDEX IF NOT EXISTS idx_achievements_user         ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_track           ON public.reactions(track_id);
