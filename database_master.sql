-- ==========================================
-- SWIPETUNES MASTER SCHEMA (PHASE 1, 2, & 3)
-- ==========================================
-- This script reconstructs the entire database from scratch.
-- Execute this in your Supabase SQL Editor.

-- 0. CLEAN SLATE (Uncomment to fully wipe)
DROP TABLE IF EXISTS public.event_attendance CASCADE;
DROP TABLE IF EXISTS public.artist_events_cache CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.user_challenge_progress CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;
DROP TABLE IF EXISTS public.user_taste_profile CASCADE;
DROP TABLE IF EXISTS public.music_journal CASCADE;
DROP TABLE IF EXISTS public.reactions CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.followers CASCADE;
DROP TABLE IF EXISTS public.songs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. CORE IDENTITY
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    display_name text,
    profile_pic_url text,
    spotify_id text UNIQUE,
    city text,
    xp integer DEFAULT 0,
    level integer DEFAULT 1,
    created_at timestamp WITH time zone DEFAULT now()
);

-- 2. DISCOVERY ENGINE
CREATE TABLE IF NOT EXISTS public.songs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id text UNIQUE NOT NULL, -- Spotify ID
    title text NOT NULL,
    artist text NOT NULL,
    album text,
    cover_url text,
    genre text[],
    energy float,
    valence float,
    created_at timestamp WITH time zone DEFAULT now()
);

-- 3. SOCIAL GRAPH
CREATE TABLE IF NOT EXISTS public.followers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    friend_id uuid REFERENCES users(id) ON DELETE CASCADE,
    status text DEFAULT 'pending', -- 'pending', 'accepted'
    created_at timestamp WITH time zone DEFAULT now(),
    UNIQUE(user_id, friend_id)
);

-- 4. REAL-TIME MESSAGING
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
    receiver_id uuid REFERENCES users(id) ON DELETE CASCADE,
    message_text text,
    track_shared text, -- Spotify track id
    read_status boolean DEFAULT false,
    created_at timestamp WITH time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_by uuid REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp WITH time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    joined_at timestamp WITH time zone DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- 5. ENGAGEMENT LAYER
CREATE TABLE IF NOT EXISTS public.likes (
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    track_id text NOT NULL, -- Spotify ID
    created_at timestamp WITH time zone DEFAULT now(),
    PRIMARY KEY (user_id, track_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    track_id text NOT NULL,
    comment_text text NOT NULL,
    created_at timestamp WITH time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    track_id text NOT NULL,
    emoji text NOT NULL,
    created_at timestamp WITH time zone DEFAULT now(),
    UNIQUE(user_id, track_id, emoji)
);

-- 6. AI & JOURNALING (PHASE 3)
CREATE TABLE IF NOT EXISTS public.music_journal (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    track_id text NOT NULL,
    action text NOT NULL, -- 'liked', 'shared', 'reacted'
    created_at timestamp WITH time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_taste_profile (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    top_genres text[],
    top_artists text[],
    avg_energy float DEFAULT 0.5,
    avg_valence float DEFAULT 0.5,
    mood_tag text,
    updated_at timestamp WITH time zone DEFAULT now()
);

-- 7. GAMIFICATION
CREATE TABLE IF NOT EXISTS public.challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    type text NOT NULL, -- 'liked', 'shared', 'reacted'
    target integer NOT NULL,
    created_at timestamp WITH time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
    progress integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    PRIMARY KEY (user_id, challenge_id)
);

-- 8. COMMUNITY & EVENTS
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    track_id text NOT NULL,
    caption text,
    hashtags text[],
    created_at timestamp WITH time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.artist_events_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id text,
    artist_name text NOT NULL,
    city text,
    venue text,
    event_date timestamp WITH time zone,
    ticket_url text,
    fetched_at timestamp WITH time zone DEFAULT now(),
    UNIQUE(artist_name, city, event_date)
);

CREATE TABLE IF NOT EXISTS public.event_attendance (
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    event_id uuid REFERENCES artist_events_cache(id) ON DELETE CASCADE,
    status text NOT NULL, -- 'going', 'interested'
    PRIMARY KEY (user_id, event_id)
);

-- 9. SEED INITIAL CHALLENGES
INSERT INTO public.challenges (title, type, target) VALUES 
('The Curator Spirit', 'liked', 10),
('Social DJ', 'shared', 5),
('Vibe Checker', 'reacted', 5)
ON CONFLICT DO NOTHING;

-- 10. REALTIME CONFIGURATION
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    messages, 
    reactions, 
    music_journal, 
    posts, 
    user_challenge_progress, 
    event_attendance;

-- 11. SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 11.1 SIMPLE POLICIES (Allow all for development)
-- WARNING: In production, refine these to proper user-only access.
CREATE POLICY "Public Read Access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Users can edit own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Messages visibility" ON public.messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
