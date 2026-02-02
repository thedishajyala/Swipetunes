-- Create profiles table
create table public.profiles (
  id text not null, -- references auth or spotify id
  email text unique,
  display_name text,
  avatar_url text,
  bio text,
  stats jsonb default '{"followers": 0, "following": 0}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Create playlists table
create table public.playlists (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  cover_url text,
  is_system_generated boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create playlist_tracks junction table
create table public.playlist_tracks (
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  track_id text not null, -- Spotify/Deezer Track ID
  track_metadata jsonb, -- Store snapshot of track info
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (playlist_id, track_id)
);

-- Create user_interactions table for trending logic
create table public.user_interactions (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.profiles(id) on delete cascade not null,
  track_id text not null,
  action text check (action in ('like', 'dislike', 'play')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_interactions_track_action on public.user_interactions(track_id, action);
create index idx_interactions_created_at on public.user_interactions(created_at);
