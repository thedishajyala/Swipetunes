# 🎵 SwipeTunes

> **Tinder for Music Discovery** — Swipe. Listen. Feel. Repeat.

SwipeTunes is a **full-stack music discovery app** powered by the **Spotify API**. Sign in with your Spotify account, get a curated feed of tracks pulled from your entire listening history, and swipe through songs like dating cards — right to like ♥, left to pass ✕. Every swipe shapes your musical identity, earns you XP, builds streaks, unlocks badges, fills your journal, and connects you with listeners who share your music DNA.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Auth](https://img.shields.io/badge/Auth-Spotify_OAuth_2.0-1DB954?logo=spotify&logoColor=white)](https://developer.spotify.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](https://choosealicense.com/licenses/mit/)

---

## 📖 Table of Contents

- [✨ Features](#-features)
  - [🃏 Core Swipe Experience](#-core-swipe-experience)
  - [🏆 Gamification & Progression](#-gamification--progression)
  - [🏅 Achievement Badges](#-achievement-badges)
  - [📓 Personal Music History & Journal](#-personal-music-history--journal)
  - [🧬 Listening Personality Archetypes](#-listening-personality-archetypes)
  - [👥 Social & Discovery](#-social--discovery)
  - [💬 Messaging](#-messaging)
  - [🤖 AI & Smart Recommendations](#-ai--smart-recommendations)
  - [🎨 UI & Design](#-ui--design)
- [🏗️ Architecture](#️-architecture)
- [🗄️ Database Schema](#️-database-schema)
- [🔌 API Reference](#-api-reference)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [☁️ Deployment](#️-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 🃏 Core Swipe Experience

| Feature | Description |
|---|---|
| **Spotify OAuth Login** | One-click sign in with Spotify — no separate registration. Auto-creates a Supabase user profile on first login. |
| **Smart Multi-Source Feed** | Pulls tracks simultaneously from: short-term top tracks, medium-term top tracks, long-term top tracks, recently played, and saved songs — then deduplicates by track ID and shuffles for variety. |
| **Prefer-Preview Strategy** | Tracks with a 30s preview URL are prioritized; the full set is used if fewer than 5 previews exist. |
| **Infinite Queue Refill** | Automatically fetches more tracks when the queue drops below 5 cards remaining. |
| **Drag-to-Swipe Cards** | Full Framer Motion drag interaction — threshold 100px triggers a like or pass with spring-physics animation. |
| **Auto-Play 30s Preview** | Audio preview auto-plays 600ms after each card appears; gracefully degrades with a "Tap to Listen" prompt on restricted browsers. |
| **Animated Waveform Visualizer** | 20-bar deterministic waveform animates in sync with audio playback; bars flatten when paused. |
| **Live Swipe Overlays** | "LIKE" (green) and "NOPE" (red) stamps overlay the card as you drag, providing instant visual feedback. |
| **Genre Filter Pills** | Real-time filter pills built from artist genre data — filter the entire deck by genre without a reload. |
| **Decade / Era Filter** | Dropdown to filter tracks by release decade: 60s, 70s, 80s, 90s, 2000s, 2010s, 2020s. |
| **Dynamic Ambient Glow** | Background radial gradient shifts to match the current track's album art color on each card change. |
| **One-Tap Spotify Link** | "Open on Spotify" link on every card — jumps directly to the full track in Spotify. |
| **In-Card Share Button** | Fires a custom `share-track` browser event that other components can listen to for curator sharing. |
| **Artist Deep-Link** | Artist name on each card links to `/artist/[id]` for a full artist deep-dive. |
| **Skeleton Loading** | Animated skeleton card replaces spinner during feed load for a polished perceived performance. |

---

### 🏆 Gamification & Progression

The XP system lives entirely in `/api/gamification` and `user_stats` table.

| Action | XP Reward |
|---|---|
| Swipe Like | **+10 XP** |
| Share Track / Post | **+25 XP** |
| Add Comment / React | **+15 XP** |
| New Follower | **+50 XP** |
| Daily Streak Bonus | **+100 XP** |
| Complete a Challenge | **Variable XP** |

**Level-Up:** You level up every `current_level × 500 XP`.

**Daily Streak Logic:**
- If you already liked a song today → streak unchanged.
- If you liked yesterday → streak increments +1 and you earn the +100 streak bonus.
- If you missed a day → streak resets to 1.

---

### 🏅 Achievement Badges

12 badges auto-awarded via `/api/badge-check` after every like:

| Badge | Emoji | Condition |
|---|---|---|
| First Play | 💿 | Like your first song |
| Tuneful | 🎵 | Like 10 songs |
| Music Lover | 🎸 | Like 50 songs |
| Century Club | 💯 | Like 100 songs |
| Legend | 🏆 | Like 500 songs |
| On Fire | 🔥 | 3-day swipe streak |
| Week Warrior | ⚡ | 7-day swipe streak |
| Monthly Master | 🌟 | 30-day swipe streak |
| Rising Star | 🚀 | Reach Level 5 |
| SwipeTunes Royalty | 👑 | Reach Level 10 |
| Genre Explorer | 🌍 | Tag 5+ different moods |
| Night Owl | 🦉 | Like a song between midnight and 5 AM |

---

### 📓 Personal Music History & Journal

| Feature | Description |
|---|---|
| **Music Journal** | Every liked or shared track is automatically written to `music_journal` via `/api/journal`. |
| **Liked Track History** | `/history` — browse all your liked tracks in reverse-chronological order. |
| **Full Swipe History** | `/swipe-history` — complete log of every swipe (liked and passed) stored in the `swipes` table. |
| **Mood Tagging** | Tag any liked track with a mood via `/api/mood` (`Chill`, `Hype`, `Sad`, `Focus`). Mood tags inform personality calculation and badge checks (Night Owl badge). |
| **Taste Profile** | `user_taste_profile` table stores `avg_energy`, `avg_valence`, and a `mood_tag` per user. |

---

### 🧬 Listening Personality Archetypes

SwipeTunes analyzes your likes to assign one of **8 archetypes** via `/api/personality`:

| Archetype | Emoji | Trigger Condition |
|---|---|---|
| **Night Owl** | 🦉 | >40% of your likes happen between 10 PM – 5 AM |
| **Hype Beast** | 🔥 | >35% of likes tagged "Hype" mood |
| **Chill Curator** | 😌 | >35% of likes tagged "Chill" mood |
| **Nostalgia Tripper** | 📼 | >40% of likes are retro tracks |
| **Genre Jumper** | 🌍 | 5+ unique artists liked (broad taste proxy) |
| **Deep Focus** | 🎯 | >30% of likes tagged "Focus" mood |
| **Sad Boi Hours** | 😢 | >30% of likes tagged "Sad" mood |
| **Sonic Wanderer** | 🎵 | Default — true music explorer |

Each archetype displays a gradient card with a tagline, description, and personal stats on your profile page.

---

### 👥 Social & Discovery

| Feature | Description |
|---|---|
| **Public Profiles** | `/profile/[id]` — view any user's archetype, top genres, liked track count, and personality card. |
| **Follow System** | Follow/unfollow users; follower and following counts tracked via `followers` table. |
| **Taste Match %** | `/api/taste-match?userId=X` — computes music compatibility: 60% weight on shared songs, 40% on shared artists, then labels the result (Music Soulmates → Opposite Worlds). |
| **People Explorer** | `/people` — browse the SwipeTunes community to find other listeners. |
| **Artist Deep-Dive** | `/artist/[id]` — see an artist's top tracks, genres, related artists, and bio pulled from Spotify. |
| **Trending Tracks** | `/trending` — real-time ranking of the top 50 most-liked tracks platform-wide from the `likes` table. |
| **Social Posts** | Post a track to the community feed with a caption and hashtags via `/api/posts`. Automatically rewards 25 XP and logs to journal. |
| **Emoji Reactions** | React to any track with an emoji via `/api/reactions`. Awards 15 XP per reaction. |
| **Concert Events** | `/api/events` — discovers upcoming events for your top 5 Spotify artists. Results cached for 24h in `artist_events_cache`. Supports RSVP (`going` / `interested`) via `event_attendance`. |
| **Export to Spotify** | `/api/export-playlist` — exports all your liked songs into a new private Spotify playlist named "SwipeTunes ❤️ Liked Songs", batched in groups of 100. |

---

### 💬 Messaging

Full DM and group chat system powered by `/api/messages`:

| Sub-feature | Description |
|---|---|
| **Direct Messages** | Send text messages (and optionally share a track) to any user. |
| **Group Chat** | Create groups, add members, send group messages. |
| **Read Receipts** | Messages are marked `read_status = true` when fetched by the receiver. |
| **Recent Chats List** | Fetches all your recent DMs and group memberships in one call. |

---

### 🤖 AI & Smart Recommendations

| Feature | Description |
|---|---|
| **Seeded Recommendations** | `/api/ai-recommendations` seeds recommendations from your 3 most recent likes and fetches from the Spotify Recommendations API (fallback to curated catalog if Spotify returns nothing). |
| **Mood Modes** | Pass `?mode=morning`, `?mode=workout`, `?mode=focus`, or `?mode=vibe` to shape audio-feature targets: |
| → Morning | `energy: 0.4`, `valence: 0.6` (gentle & uplifting) |
| → Workout | `min_tempo: 120`, `energy: 0.8` (high-intensity) |
| → Focus | `energy: 0.3`, `acousticness: 0.7` (calm & instrumental) |
| → Vibe | `target_popularity: 50` (hidden gems) |
| **Fallback Catalog** | `/lib/fallback-catalog.js` — curated tracks served if Spotify API is unavailable (e.g., deprecation events). |
| **Spotify Library Sync** | `/api/sync-tracks` — batch-syncs 50 pop tracks from Spotify into the `songs` table using client credentials (no user token needed). |
| **Weekly Challenges** | `/api/challenges` — challenge system with progress tracking; completing a challenge triggers a bonus XP call to `/api/gamification`. |

---

### 🎨 UI & Design

| Feature | Description |
|---|---|
| **Dark OLED Aesthetic** | Near-black `#111` backgrounds with glassmorphism cards, subtle white borders (`rgba(255,255,255,0.06)`), and layered blur effects. |
| **Spotify Green System** | Consistent `#1DB954` accent — gradient buttons, glowing CTAs (`glow-green` class), green progress bars. |
| **Micro-Animations** | Spring-physics on card entry, hover scale on all buttons, animated waveform bars, pulse ring on audio prompt. |
| **Skeleton Loader** | `SkeletonCard` component mirrors the real card layout during feed fetch. |
| **Framer Motion** | Card drag physics, page transitions, list item stagger animations, ambient background fades. |
| **Premium Typography** | Google Fonts integration; bold 900-weight headlines with `tracking-tighter` for a modern editorial feel. |
| **Responsive Sidebar** | `Sidebar.js` (12KB) contains full navigation, streak counter, XP display, and badge showcase — collapses cleanly on mobile. |
| **Full App Router** | Next.js 15 App Router with per-route layouts; `providers.js` wraps the session provider at the root. |

---

## 🏗️ Architecture

SwipeTunes follows a clean **3-Tier Monorepo** pattern:

```
┌──────────────────────┐          ┌──────────────────────┐          ┌─────────────────────────┐
│   Next.js Frontend   │ ◄─HTTPS─► │  Node.js Express API │ ◄─TCP──► │  Supabase (PostgreSQL)  │
│      Port 3000       │          │       Port 5001      │          │      Cloud Database      │
└──────────────────────┘          └──────────────────────┘          └─────────────────────────┘
          │
          ▼
    Spotify Web API
  (OAuth + Data Endpoints)
```

### Backend MVC Structure

```
backend/
├── index.js               # Express server entry point, route mounting
├── controllers/
│   ├── actionController.js  # Swipe/action recording + playlist trigger
│   ├── socialController.js  # Follow, getFollowers, getFollowing, getTasteMatch
│   ├── playlistController.js# Trending & user playlists
│   └── userController.js    # User profile data
├── routes/
│   ├── actionRoutes.js      # POST /action  (Zod-validated)
│   ├── socialRoutes.js      # POST /follow, GET /followers/:id, GET /following/:id, GET /taste-match
│   ├── playlistRoutes.js    # GET /playlist/today|user|view, GET /playlists/trending
│   └── userRoutes.js        # GET /users/:id
├── middleware/
│   ├── logger.js            # Request logging
│   ├── errorHandler.js      # Central error handler
│   └── validation.js        # Zod schema validation
├── lib/                      # Shared backend utilities
└── db/                       # Supabase client + SQL indexes
```

### Frontend App Structure

```
frontend/
├── app/
│   ├── page.js              # 🏠 Main swipe feed (home)
│   ├── layout.js            # Root layout with sidebar + provider
│   ├── providers.js         # NextAuth SessionProvider wrapper
│   ├── leaderboard/         # 🏆 Ranked leaderboard (week / month / all-time)
│   ├── history/             # 📋 Liked track history
│   ├── swipe-history/       # 📜 Complete swipe log
│   ├── trending/            # 🔥 Top 50 trending tracks
│   ├── people/              # 👥 Community explorer
│   ├── profile/             # 👤 User profile + personality card
│   ├── artist/[id]/         # 🎤 Artist deep-dive
│   ├── artists/             # 🎼 Artist browser
│   ├── admin/               # ⚙️  Admin dashboard
│   └── api/                 # Next.js API routes (see full table below)
├── components/
│   ├── SwipeCard.js         # Core swipe card: art, audio, waveform, overlays, share
│   ├── SkeletonCard.js      # Animated loading skeleton
│   ├── Sidebar.js           # Navigation, streak, XP, badges
│   ├── ProfileHeader.js     # Public profile page header
│   ├── ArtistCircle.js      # Circular artist avatar
│   ├── ArtistGrid.js        # Grid of artist circles
│   ├── CircleCard.js        # Generic circular content card
│   ├── CircleGrid.js        # Grid layout for circle cards
│   ├── TrackListItem.js     # Single track row in list views
│   └── UserProfile.js       # User profile card widget
├── lib/
│   ├── auth.js              # NextAuth config, Spotify OAuth, token refresh, Supabase upsert
│   ├── spotify.js           # Spotify API helpers (top tracks, artists, recommendations)
│   ├── supabase.js          # Supabase client (anon key)
│   ├── supabase-admin.js    # Supabase service-role client (server-side)
│   ├── api.js               # saveAction() helper to call Express backend
│   └── fallback-catalog.js  # Curated fallback tracks
├── database_master.sql      # ⬅️ Full PostgreSQL schema — run this in Supabase
└── public/                  # Static assets & icons
```

---

## 🗄️ Database Schema

Full schema in [`database_master.sql`](./frontend/database_master.sql). Run it in the Supabase SQL Editor for a complete setup including tables, RLS policies, and seed data.

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Spotify-linked user profiles | `id (uuid)`, `spotify_id`, `display_name`, `profile_pic_url`, `xp`, `level`, `city` |
| `songs` | Cached track metadata | `track_id (unique)`, `title`, `artist`, `album`, `cover_url`, `preview_url` |
| `swipes` | Full swipe log (liked + passed) | `user_id`, `track_id`, `liked (bool)` |
| `likes` | Liked tracks (primary key: user_id + track_id) | `user_id`, `track_id`, `mood`, `created_at` |
| `followers` | Follow relationships | `user_id`, `friend_id`, `status` |
| `messages` | DMs and group messages | `sender_id`, `receiver_id`, `group_id`, `message_text`, `track_shared`, `read_status` |
| `groups` | Group chat rooms | `name`, `created_by` |
| `group_members` | Group membership | `group_id`, `user_id` |
| `music_journal` | Automatic like/share activity log | `user_id`, `track_id`, `action` |
| `user_taste_profile` | Computed taste fingerprint | `avg_energy`, `avg_valence`, `mood_tag` |
| `challenges` | Challenge definitions | `title`, `type`, `target` |
| `user_challenge_progress` | Per-user challenge state | `user_id`, `challenge_id`, `progress`, `is_completed` |
| `posts` | Social music posts | `user_id`, `track_id`, `caption`, `hashtags[]` |
| `reactions` | Emoji reactions on tracks | `user_id`, `track_id`, `emoji` |
| `artist_events_cache` | Cached concert events | `artist_name`, `city`, `venue`, `event_date`, `ticket_url`, `fetched_at` |
| `event_attendance` | RSVP records | `user_id`, `event_id`, `status` |
| `user_stats` | XP, level, streak per user | `user_id`, `xp`, `level`, `streak_count`, `last_activity` |
| `user_achievements` | Awarded badges | `user_id`, `badge_id`, `awarded_at` |

> 🔒 Row Level Security (RLS) is enabled on all tables with permissive developer-mode policies. Supabase Realtime is enabled for all tables.

---

## 🔌 API Reference

### Express Backend (Port 5001)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/action` | — | Record a swipe action; triggers daily playlist generation. Validated with Zod. |
| `GET` | `/playlists/trending` | — | Top community-liked playlists |
| `GET` | `/playlist/today` | — | Today's generated playlist |
| `POST` | `/follow` | — | Follow a user |
| `GET` | `/followers/:id` | — | Get followers list for user |
| `GET` | `/following/:id` | — | Get following list for user |
| `GET` | `/taste-match` | — | Compute taste compatibility between two users |
| `GET` | `/users/:id` | — | Fetch user profile |

### Next.js API Routes (Port 3000)

| Method | Endpoint | Requires Auth | Description |
|---|---|---|---|
| `POST` | `/api/gamification` | ✅ | Award XP for an action (`swipe_like`, `share_track`, `add_comment`, `new_follower`, `daily_streak`). Returns new XP, level, and streak. |
| `GET` | `/api/gamification` | ✅ | Fetch current XP, level, streak, and all achievements. |
| `POST` | `/api/badge-check` | ✅ | Evaluate all 12 badge conditions and award any newly unlocked badges. |
| `GET` | `/api/badge-check` | ✅ | Return all badges with earned/unearned status. |
| `POST` | `/api/journal` | ✅ | Log a track action to `music_journal`. Triggers challenge progress update. |
| `GET` | `/api/journal` | ✅ | Fetch the 20 most recent journal entries for the user. |
| `GET` | `/api/challenges` | ✅ | Fetch all active challenges merged with user's current progress. |
| `POST` | `/api/challenges` | ✅ | Increment progress on matching challenges; awards XP on completion. |
| `GET` | `/api/personality` | ✅ | Compute and return user's listening archetype from like patterns. |
| `POST` | `/api/mood` | ✅ | Tag a liked track with a mood (`Chill`, `Hype`, `Sad`, `Focus`). |
| `GET` | `/api/leaderboard?period=week\|month\|alltime` | — | Top 25 users ranked by like count for the selected period. |
| `GET` | `/api/trending` | — | Top 50 most-liked tracks platform-wide. |
| `GET` | `/api/ai-recommendations?mode=vibe\|morning\|workout\|focus` | ✅ | Seed-based smart recommendations with mood-mode audio feature targeting. |
| `POST` | `/api/export-playlist` | ✅ | Export all liked songs to a new private Spotify playlist (batched 100/request). |
| `GET` | `/api/events?city=...` | ✅ | Fetch upcoming events for your top artists. Cached 24h; supports RSVP. |
| `POST` | `/api/events` | ✅ | RSVP to an event (`going` / `interested`). |
| `GET/POST` | `/api/posts` | ✅ | Get community feed / create a post with track, caption, and hashtags. |
| `GET/POST` | `/api/reactions` | ✅ | Get emoji reactions for a track / add an emoji reaction. |
| `GET/POST` | `/api/messages` | ✅ | Fetch DMs or group messages / Send a message (text + optional track share). |
| `GET/POST` | `/api/recommendations` | ✅ | Base recommendations endpoint. |
| `GET` | `/api/sync-tracks` | — | Batch-sync 50 Spotify pop tracks into the `songs` catalog table. |
| `GET/PUT` | `/api/profile` | ✅ | Read or update the authenticated user's profile. |
| `GET` | `/api/taste-match?userId=...` | ✅ | Music compatibility % between you and another user. |
| `GET` | `/api/users` | ✅ | User listing for People explorer. |
| `GET` | `/api/feed` | ✅ | Curated discovery feed data. |

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend Framework** | Next.js App Router | 15 |
| **UI Library** | React | 19 |
| **Styling** | TailwindCSS | v4 |
| **Animation** | Framer Motion | Latest |
| **Auth** | NextAuth.js (Spotify OAuth 2.0) | v4 |
| **Backend** | Node.js + Express.js | — |
| **Database** | Supabase (PostgreSQL) | — |
| **Music API** | Spotify Web API | — |
| **Input Validation** | Zod (backend middleware) | — |
| **Icons** | React Icons | — |
| **Notifications** | React Hot Toast | — |
| **Typography** | Google Fonts (Inter family) | — |

### Spotify OAuth Scopes Requested

```
user-read-email, user-read-private,
playlist-read-private, playlist-read-collaborative,
playlist-modify-public, playlist-modify-private,
user-library-read, user-library-modify,
user-top-read, user-read-recently-played,
streaming
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Spotify Developer Account** → [Create an app](https://developer.spotify.com/dashboard) with `http://localhost:3000/api/auth/callback/spotify` as a Redirect URI
- **Supabase Project** → [supabase.com](https://supabase.com)

### 1. Clone the repository

```bash
git clone https://github.com/thedishajyala/Swipetunes.git
cd Swipetunes
```

### 2. Install all dependencies

```bash
npm run install:all
```

Installs dependencies for root, `frontend/`, and `backend/` in a single command.

### 3. Configure environment variables

**`frontend/.env.local`**
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any_random_32_char_string
```

**`backend/.env`**
```env
PORT=5001
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
```

### 4. Set up the database

1. Go to your [Supabase SQL Editor](https://app.supabase.com)
2. Open `frontend/database_master.sql`
3. Paste the entire file and click **Run**

This creates all 18+ tables, enables RLS with permissive policies, seeds challenge data, and enables Supabase Realtime on all tables.

### 5. Start the app

```bash
npm run dev
```

| Service | URL |
|---|---|
| 🎵 SwipeTunes (Frontend) | http://localhost:3000 |
| ⚙️ Express API (Backend) | http://localhost:5001 |

Run individually:
```bash
npm run dev:frontend   # Next.js dev server
npm run dev:backend    # Express API
```

---

## ☁️ Deployment

### Frontend → Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. **Settings → General → Root Directory** → set to `frontend`
3. Add all `frontend/.env.local` variables in **Settings → Environment Variables**
4. Redeploy

Update your Spotify app's Redirect URI to your Vercel domain:
```
https://your-app.vercel.app/api/auth/callback/spotify
```

### Backend → Render / Railway

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node index.js` |
| Environment Variables | `SUPABASE_URL`, `SUPABASE_KEY`, `PORT` |

---

## 📁 Full Project Structure

```
Swipetunes/                         ← Monorepo root
├── package.json                    ← Root scripts: dev, install:all
├── frontend/                       ← Next.js 15 application
│   ├── app/
│   │   ├── page.js                 ← Main swipe feed
│   │   ├── layout.js               ← Root layout (sidebar + providers)
│   │   ├── globals.css             ← Global styles + animations
│   │   ├── leaderboard/page.js     ← Podium + ranked table (week/month/all-time)
│   │   ├── history/page.js         ← Liked track history
│   │   ├── swipe-history/page.js   ← Full swipe log
│   │   ├── trending/page.js        ← Top 50 platform tracks
│   │   ├── people/page.js          ← Community explorer
│   │   ├── profile/[id]/page.js    ← Public user profile + archetype
│   │   ├── artist/[id]/page.js     ← Artist deep-dive
│   │   ├── admin/page.js           ← Admin dashboard
│   │   └── api/                    ← 22 Next.js API route handlers
│   ├── components/                 ← 10 reusable UI components
│   ├── lib/                        ← 6 helper/config files
│   ├── public/                     ← Static assets
│   └── database_master.sql         ← Complete PostgreSQL schema
└── backend/                        ← Express.js API
    ├── index.js                    ← Server entry, CORS, route mounting
    ├── controllers/                ← 4 domain controllers (action, social, playlist, user)
    ├── routes/                     ← 4 route files
    ├── middleware/                 ← Logger, error handler, Zod validation
    ├── lib/                        ← Shared utilities
    └── db/                         ← Supabase client
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the [MIT License](https://choosealicense.com/licenses/mit/).

---

<p align="center">
  Made with ❤️ and 🎵 by <a href="https://github.com/thedishajyala">Disha Jyala</a>
</p>
