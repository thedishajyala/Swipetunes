-- 1. Playlists Table
-- One playlist per user per day
create table if not exists playlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) not null,
  date date default current_date not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date) -- Enforce one playlist per user per day
);

-- 2. Playlist Tracks Table
-- Songs inside a playlist
create table if not exists playlist_tracks (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references playlists(id) on delete cascade not null,
  track_id text not null, -- Spotify Track ID
  track_name text not null,
  artist text,
  preview_url text,
  cover_url text, -- Useful for UI
  added_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Follows Table
-- Social Graph
create table if not exists follows (
  follower_id uuid references users(id) not null,
  following_id uuid references users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

-- 4. Playlist Views Table
-- For calculating trending playlists
create table if not exists playlist_views (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references playlists(id) on delete cascade not null,
  viewer_id uuid references users(id), -- Nullable for anonymous views if needed
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Policies (Optional, if RLS is enabled)
-- alter table playlists enable row level security;
-- create policy "Public playlists are viewable by everyone." on playlists for select using (true);
