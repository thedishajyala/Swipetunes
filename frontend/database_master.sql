-- ===========================================
-- SWIPETUNES MASTER SCHEMA (TOTAL RESTORATION)
-- ===========================================

-- 0. CLEAN SLATE
DROP TABLE IF EXISTS public.event_attendance CASCADE;
DROP TABLE IF EXISTS public.artist_events_cache CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.user_posts CASCADE;
DROP TABLE IF EXISTS public.user_challenge_progress CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;
DROP TABLE IF EXISTS public.user_taste_profile CASCADE;
DROP TABLE IF EXISTS public.music_journal CASCADE;
DROP TABLE IF EXISTS public.reactions CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.swipes CASCADE;
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
    created_at timestamp WITH time zone DEFAULT now(),
    updated_at timestamp WITH time zone DEFAULT now()
);

-- 2. DISCOVERY & CATALOG
CREATE TABLE IF NOT EXISTS public.songs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id text UNIQUE NOT NULL, 
    title text,
    artist text,
    album text,
    cover_url text,
    liked_by uuid[] DEFAULT '{}',
    created_at timestamp WITH time zone DEFAULT now()
);

-- 3. INTERACTION & SOCIAL
CREATE TABLE IF NOT EXISTS public.swipes (
    id bigint generated always as identity primary key,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    track_id text NOT NULL,
    liked boolean DEFAULT false,
    created_at timestamp WITH time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.likes (
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    track_id text NOT NULL,
    created_at timestamp WITH time zone DEFAULT now(),
    PRIMARY KEY (user_id, track_id)
);

CREATE TABLE IF NOT EXISTS public.followers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    friend_id uuid REFERENCES users(id) ON DELETE CASCADE,
    status text DEFAULT 'pending',
    created_at timestamp WITH time zone DEFAULT now(),
    UNIQUE(user_id, friend_id)
);

-- 4. MESSAGING & GROUPS
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
    receiver_id uuid REFERENCES users(id) ON DELETE CASCADE,
    message_text text,
    track_shared text,
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

-- 5. PHASE 3 MODULES
CREATE TABLE IF NOT EXISTS public.music_journal (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    track_id text NOT NULL,
    action text NOT NULL,
    created_at timestamp WITH time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_taste_profile (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    avg_energy float DEFAULT 0.5,
    avg_valence float DEFAULT 0.5,
    mood_tag text,
    updated_at timestamp WITH time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    type text NOT NULL,
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
    status text NOT NULL,
    PRIMARY KEY (user_id, event_id)
);

-- 6. SEED DATA
INSERT INTO public.challenges (id, title, type, target) VALUES 
('c178396a-37a5-4204-a14f-37f07096e2c3', 'The Curator Spirit', 'liked', 5),
('c178396a-37a5-4204-a14f-37f07096e2c4', 'Vibe Checker', 'reacted', 3)
ON CONFLICT (id) DO NOTHING;

-- 7. SECURITY (DEVELOPER-FRIENDLY RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All Users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow All Songs" ON public.songs FOR ALL USING (true);
CREATE POLICY "Allow All Swipes" ON public.swipes FOR ALL USING (true);
CREATE POLICY "Allow All Likes" ON public.likes FOR ALL USING (true);
CREATE POLICY "Allow All Followers" ON public.followers FOR ALL USING (true);
CREATE POLICY "Allow All Messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow All Groups" ON public.groups FOR ALL USING (true);
CREATE POLICY "Allow All Group Members" ON public.group_members FOR ALL USING (true);
CREATE POLICY "Allow All Journal" ON public.music_journal FOR ALL USING (true);
CREATE POLICY "Allow All Posts" ON public.posts FOR ALL USING (true);

-- 8. REALTIME
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
