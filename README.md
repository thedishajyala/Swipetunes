# 🎵 SwipeTunes

> **Tinder for Music Discovery** — Swipe. Listen. Vibe. Repeat.

SwipeTunes is a full-stack music discovery app powered by the **Spotify API**. Sign in with your Spotify account, get curated tracks pulled from your listening history across all time ranges, and swipe through songs like dating cards — right to like, left to pass. Every swipe shapes your musical identity, earns you XP, unlocks achievements, fills your journal, and connects you with people who share your music DNA.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Auth](https://img.shields.io/badge/Auth-Spotify_OAuth-1DB954?logo=spotify)](https://developer.spotify.com)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS_v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](https://choosealicense.com/licenses/mit/)

---

## ✨ Features at a Glance

### 🃏 Core Swipe Experience
| Feature | Description |
|---|---|
| **Spotify OAuth Login** | One-click sign-in with Spotify — no separate account needed |
| **Smart Multi-Source Feed** | Combines short-term, medium-term & long-term top tracks + recently played + liked songs — deduped & shuffled for variety |
| **Infinite Scroll Queue** | Auto-refills the card queue when fewer than 5 tracks remain |
| **Drag-to-Swipe Cards** | Smooth Framer Motion card stack — drag right to like ♥, drag left to pass ✕ |
| **Auto-Play 30s Previews** | Audio preview auto-starts on every new card; animated waveform visualizer syncs with playback |
| **Animated Swipe Indicators** | Live "Like" / "Nope" overlays appear as you drag the card |
| **One-Tap Spotify Link** | Jump straight to the full track on Spotify from the card |
| **Share Track** | Share a track with another curator via the in-card share button |
| **Genre Filter Pills** | Filter the swipe deck by genre in real time |
| **Decade Filter** | Browse by era — 60s, 70s, 80s, 90s, 2000s, 2010s, 2020s |
| **Dynamic Ambient Glow** | Background softly shifts color to match the current track's album art |

---

### 🏆 Gamification & Progression
| Feature | Description |
|---|---|
| **XP System** | Earn XP for every swipe-like via `/api/gamification` |
| **Daily Streak Counter** | Log in and swipe daily to keep your streak alive; streak resets if you miss a day |
| **Achievement Badges** | Auto-awarded at milestone swipe counts via `/api/badge-check` (e.g., First Like, 10 Swipes, 50 Swipes…) |
| **Leaderboard** | See the top users by XP and the most-liked tracks platform-wide |
| **Weekly Challenges** | Time-limited swipe challenges that award bonus XP and badges |

---

### 📓 Personal Music History
| Feature | Description |
|---|---|
| **Music Journal** | Every liked track is automatically logged to your journal via `/api/journal` |
| **Liked Track History** | Browse all your liked tracks in a clean list view (`/history`) |
| **Full Swipe History** | See every track you've swiped — liked or passed — in chronological order (`/swipe-history`) |
| **Listening Personality** | Your profile shows one of 8 archetypes (Sonic Explorer, Hype Machine, Nostalgist, etc.) derived from your mood, time-of-day, and taste data via `/api/personality` |
| **Mood-Based Feed** | `/api/mood` endpoint tags your session mood and influences recommendation weighting |

---

### 👥 Social & Discovery
| Feature | Description |
|---|---|
| **Public User Profiles** | Personalized profile pages showing top genres, personality archetype, and liked tracks |
| **Follow System** | Follow other music lovers to explore their universe |
| **Taste Match %** | Get a music compatibility percentage with any user based on shared tracks and artists via `/api/taste-match` |
| **People Explorer** | Browse the SwipeTunes community and discover listeners like you (`/people`) |
| **Artist Deep-Dive** | Tap any artist name to see their top tracks, related artists, genres, and bio (`/artist/[id]`) |
| **Trending Playlists** | Daily auto-generated playlists built from the most-liked swipes across the platform (`/trending`) |
| **Events Feed** | `/api/events` — discover music events and concerts tied to your top artists |
| **Posts & Reactions** | `/api/posts` & `/api/reactions` — share micro-posts and react to others' music moments |
| **Messages** | `/api/messages` — send and receive DMs with fellow listeners |
| **Export to Spotify Playlist** | Export any collection of liked tracks directly to a new Spotify playlist via `/api/export-playlist` |

---

### 🤖 AI & Recommendations
| Feature | Description |
|---|---|
| **AI Recommendations** | `/api/ai-recommendations` — seed-based smart recommendations powered by your recent likes with mood-mode variants: `morning`, `workout`, `focus`, `vibe` |
| **Mood Modes** | Toggle between listening modes — each applies different audio-feature targets (energy, valence, tempo, acousticness) |
| **Fallback Catalog** | Graceful fallback to a curated catalog if Spotify API is unavailable |
| **Sync Tracks** | `/api/sync-tracks` — syncs your Spotify library with the app's database for consistent cross-feature data |

---

### 🎨 UI & Design
| Feature | Description |
|---|---|
| **Dark Glassmorphism Design** | Deep OLED blacks with glass-effect cards, soft borders, and layered blur |
| **Custom Animated Waveform** | Deterministic waveform bars animate to the beat while audio plays |
| **Skeleton Loading States** | Smooth skeleton cards replace spinners during feed load |
| **Micro-Animations** | Hover glow effects on all buttons; spring-physics transitions throughout |
| **Spotify Green Accent System** | Consistent `#1DB954` theming with green glow effects on primary CTAs |
| **Responsive Layout** | Optimized for all screen sizes; sidebar collapses cleanly on mobile |
| **Custom Google Font** | Premium Inter-family typography rendered at proper weights |

---

## 🏗️ Architecture

SwipeTunes follows a clean **3-Tier Monorepo** architecture:

```
┌─────────────────────┐        ┌──────────────────────┐        ┌───────────────────────┐
│   Next.js Frontend  │◄─HTTPS►│  Node.js Express API │◄─TCP──►│  Supabase (PostgreSQL) │
│     (Port 3000)     │        │     (Port 5001)      │        │     Cloud Database     │
└─────────────────────┘        └──────────────────────┘        └───────────────────────┘
        │
        ▼
   Spotify Web API
```

### Backend MVC Structure

```
backend/
├── controllers/          # Business logic per domain
├── routes/
│   ├── actionRoutes.js   # Swipe recording + daily playlist trigger
│   ├── playlistRoutes.js # Trending & user playlists
│   ├── socialRoutes.js   # Follow, taste-match
│   └── userRoutes.js     # User data & profiles
├── middleware/            # Zod validation, error handling, request logging
├── lib/                   # Shared utilities
└── db/                    # Supabase client + optimized SQL indexes
```

### Frontend App Structure

```
frontend/app/
├── page.js               # Main swipe feed (Home)
├── profile/              # User profiles + listening personality
├── people/               # Community explorer
├── artist/[id]/          # Artist deep-dive pages
├── artists/              # Artist catalog browser
├── history/              # Liked track history
├── swipe-history/        # Full swipe log (liked + passed)
├── trending/             # Trending community playlists
├── leaderboard/          # Top users by XP
├── admin/                # Admin dashboard
└── api/                  # Next.js API routes:
    ├── ai-recommendations/  # Mood-based smart recommendations
    ├── badge-check/         # Achievement badge logic
    ├── challenges/          # Weekly challenge management
    ├── events/              # Music events tied to top artists
    ├── export-playlist/     # Export liked tracks → Spotify playlist
    ├── feed/                # Feed data endpoint
    ├── gamification/        # XP awarding
    ├── journal/             # Music journal logging
    ├── leaderboard/         # Leaderboard data
    ├── messages/            # DM system
    ├── mood/                # Mood detection & tagging
    ├── personality/         # Listening archetype calculation
    ├── posts/               # Social posts
    ├── profile/             # Profile data
    ├── reactions/           # Post reactions
    ├── recommendations/     # Base recommendations
    ├── sync-tracks/         # Spotify library sync
    ├── taste-match/         # Music compatibility %
    ├── trending/            # Trending playlist data
    └── users/               # User management
```

### Frontend Components

```
frontend/components/
├── SwipeCard.js          # Core swipe card with audio, waveform, overlays
├── SkeletonCard.js       # Loading skeleton placeholder
├── Sidebar.js            # Navigation sidebar with streak, XP, badges
├── ProfileHeader.js      # Public profile header
├── ArtistCircle.js       # Artist avatar circle component
├── ArtistGrid.js         # Grid layout for artist display
├── CircleCard.js         # Circular content card
├── CircleGrid.js         # Grid layout for circle cards
├── TrackListItem.js      # Single track row in list views
└── UserProfile.js        # User profile card component
```

---

## 🔌 Key API Endpoints

### Backend (Express — Port 5001)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/action` | Record a swipe action & trigger daily playlist generation |
| `GET` | `/playlists/trending` | Fetch top community playlists |
| `POST` | `/follow` | Follow a user |
| `GET` | `/taste-match` | Music compatibility % between two users |
| `GET` | `/users/:id` | Fetch user profile data |

### Frontend API Routes (Next.js — Port 3000)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/gamification` | Award XP for swipe actions |
| `POST` | `/api/journal` | Log a liked track to the music journal |
| `POST` | `/api/badge-check` | Evaluate and award milestone badges |
| `GET` | `/api/ai-recommendations` | Mood-based smart track recommendations |
| `GET` | `/api/personality` | Calculate and return listening personality archetype |
| `GET` | `/api/mood` | Detect and tag current listening mood |
| `GET` | `/api/leaderboard` | Fetch global XP leaderboard |
| `GET` | `/api/trending` | Fetch trending playlists |
| `POST` | `/api/export-playlist` | Export liked tracks to a Spotify playlist |
| `GET` | `/api/taste-match` | Compute taste compatibility between users |
| `GET/POST` | `/api/messages` | Fetch/send direct messages |
| `GET/POST` | `/api/posts` | Fetch/create social posts |
| `POST` | `/api/reactions` | React to a post |
| `GET` | `/api/events` | Discover events for top artists |
| `POST` | `/api/sync-tracks` | Sync Spotify library with app database |
| `GET` | `/api/feed` | Curated feed data |
| `GET/PUT` | `/api/profile` | Read/update user profile |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TailwindCSS v4, Framer Motion |
| **Auth** | NextAuth.js v4 with Spotify OAuth 2.0 |
| **Backend** | Node.js, Express.js |
| **Database** | Supabase (PostgreSQL) with optimized SQL indexes |
| **Music API** | Spotify Web API (top tracks, recently played, saved songs, artists, recommendations) |
| **Validation** | Zod (backend middleware) |
| **UI Extras** | React Icons, React Hot Toast, custom CSS animations |
| **Fonts** | Google Fonts — Inter / custom premium typography |

---

## 🗄️ Database Schema (Overview)

| Table | Purpose |
|---|---|
| `users` | Spotify-linked user profiles, XP, streaks, personality |
| `songs` | Persisted track metadata (id, title, artist, album, cover, preview_url) |
| `likes` | User ↔ track like events |
| `swipes` | Full swipe history (liked + passed) |
| `badges` | Available achievement badges |
| `user_badges` | Awarded badges per user |
| `follows` | User follow relationships |
| `journal` | Music journal entries per user |
| `trending_playlists` | Auto-generated daily trending playlists |
| `posts` | Social micro-posts |
| `reactions` | Reactions to posts |
| `messages` | DM threads |
| `challenges` | Weekly challenge definitions |
| `user_challenges` | Challenge progress per user |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- A **Spotify Developer** account → [Create App](https://developer.spotify.com/dashboard)
- A **Supabase** project → [supabase.com](https://supabase.com)

### 1. Clone the repository

```bash
git clone https://github.com/thedishajyala/Swipetunes.git
cd Swipetunes
```

### 2. Install all dependencies

```bash
npm run install:all
```

This installs dependencies for the root, frontend, and backend in one shot.

### 3. Configure environment variables

**`frontend/.env.local`**
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

**`backend/.env`**
```env
PORT=5001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

### 4. Set up the database

Run the master SQL migration to create all tables and indexes:

```bash
# Copy frontend/database_master.sql into the Supabase SQL editor and run it
```

### 5. Run the app

Start both frontend and backend simultaneously:

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001 |

Or run individually:

```bash
npm run dev:frontend   # Next.js only
npm run dev:backend    # Express API only
```

---

## ☁️ Deployment

### Frontend → Vercel

Since this is a monorepo, configure Vercel to point at the `frontend/` folder:

1. Go to **Project Settings → General**
2. Under **Root Directory**, click **Edit** → set to: `frontend`
3. Save and **Redeploy**

Add all `frontend/.env.local` variables in Vercel's **Environment Variables** panel.

### Backend → Render / Railway

Deploy the `backend/` folder as a separate **Web Service**:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node index.js` |
| Env Variables | `SUPABASE_URL`, `SUPABASE_KEY`, `PORT` |

---

## 📁 Project Structure

```
Swipetunes/
├── frontend/             # Next.js 15 application
│   ├── app/              # App router pages + API routes
│   ├── components/       # Reusable UI components
│   ├── lib/              # Auth, Spotify, Supabase helpers
│   ├── public/           # Static assets
│   └── database_master.sql  # Full DB schema
├── backend/              # Express.js API server
│   ├── controllers/      # Business logic
│   ├── routes/           # Express route handlers
│   ├── middleware/        # Validation, error handling
│   └── db/               # Supabase client
└── package.json          # Root monorepo scripts
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first.

1. Fork the repo
2. Create your branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the [MIT License](https://choosealicense.com/licenses/mit/).

---

<p align="center">Made with ❤️ and 🎵 by <a href="https://github.com/thedishajyala">Disha Jyala</a></p>
