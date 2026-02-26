# 🎵 SwipeTunes

> **Tinder for Music Discovery** — Swipe. Like. Vibe.

SwipeTunes is a full-stack music discovery app powered by the **Spotify API**. Sign in with your Spotify account, get curated song recommendations drawn from your listening history across all time ranges, and swipe through tracks like dating cards — right to like, left to pass. Every swipe shapes your profile, unlocks achievements, builds your playlists, and lets you connect with people who match your music DNA.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![Database](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Auth](https://img.shields.io/badge/Auth-Spotify_OAuth-1DB954?logo=spotify)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 🃏 Core Swipe Experience
| Feature | Description |
|---|---|
| **Spotify OAuth Login** | Sign in with Spotify — no separate registration |
| **Smart Track Feed** | Pulls from short-term, medium-term, and long-term top tracks + recently played + saved songs, then deduplicates and shuffles for variety |
| **Swipe Interface** | Smooth drag-and-drop card stack powered by Framer Motion |
| **30s Audio Previews** | Listen to a track snippet directly on the card before deciding |
| **Like & Pass** | Swipe right ♥ to like, left ✕ to pass — logged to both Supabase and backend |
| **Genre Filter Pills** | Filter the swipe deck by genre in real time |
| **Decade Filter** | Browse tracks from a specific era — 60s, 70s, 80s, 90s, 2000s, 2010s, 2020s |
| **Infinite Scroll** | Queue auto-refills when fewer than 5 cards remain |

### 🏆 Gamification & Progression
| Feature | Description |
|---|---|
| **XP System** | Earn XP on every like — tracked via `/api/gamification` |
| **Daily Streak Counter** | Log in and swipe daily to keep your streak alive |
| **Achievement Badges** | Auto-awarded at milestone swipe counts via `/api/badge-check` |
| **Leaderboard** | See the top users and most-liked tracks on the platform |

### 📓 Personal Music History
| Feature | Description |
|---|---|
| **Music Journal** | Every liked track is automatically logged to your journal via `/api/journal` |
| **Swipe History** | Browse all your past liked and passed tracks in one view |
| **Listening Personality Card** | Your profile shows one of 8 archetypes (e.g. Sonic Explorer, Hype Machine) derived from your mood, time-of-day, and taste data |

### 👥 Social & Discovery
| Feature | Description |
|---|---|
| **User Profiles** | Public profile pages showing top genres, personality, and liked tracks |
| **Follow Users** | Follow other music lovers and explore their listening world |
| **Taste Match %** | Get a music compatibility score with any user based on shared songs and artists |
| **People Explorer** | Browse the SwipeTunes community and discover listeners like you |
| **Artist Deep-Dive** | Tap any artist to see their top tracks, related artists, and bio |
| **Trending Playlists** | Daily auto-generated playlists built from the most-liked swipes across the platform |

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
├── controllers/         # Business logic
├── routes/
│   ├── actionRoutes.js  # Swipe recording + daily playlist trigger
│   ├── playlistRoutes.js# Trending & user playlists
│   ├── socialRoutes.js  # Follow, taste-match
│   └── userRoutes.js    # User data
├── middleware/          # Zod validation, error handling, logging
└── db/                  # Supabase client + optimized SQL indexes
```

### Frontend App Structure

```
frontend/app/
├── page.js              # Main swipe feed
├── profile/             # User profiles + listening personality
├── people/              # Community explorer
├── artist/              # Artist deep-dive pages
├── history/             # Liked track history
├── swipe-history/       # Full swipe log
├── trending/            # Trending playlists
├── leaderboard/         # Top users
└── api/                 # Next.js API routes (gamification, journal, badges, auth)
```

### Key API Endpoints

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Action** | POST | `/action` | Records swipe & triggers daily playlist generation |
| **Playlist** | GET | `/playlists/trending` | Returns top community playlists |
| **Social** | POST | `/follow` | Follow another user |
| **Social** | GET | `/taste-match` | Music compatibility % between two users |
| **Gamification** | POST | `/api/gamification` | Award XP for actions |
| **Badges** | POST | `/api/badge-check` | Check and award milestone badges |
| **Journal** | POST | `/api/journal` | Log liked track to music journal |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TailwindCSS v4, Framer Motion |
| **Auth** | NextAuth.js v4 with Spotify OAuth |
| **Backend** | Node.js, Express |
| **Database** | Supabase (PostgreSQL) with optimized SQL indexes |
| **Music API** | Spotify Web API (top tracks, recently played, saved songs, artists) |
| **Validation** | Zod (backend middleware) |
| **UI Extras** | React Icons, React Hot Toast |

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

### 4. Run the app

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

### Backend → Render / Railway

Deploy the `backend/` folder as a separate **Web Service**:

| Setting | Value |
|---|---|
| Build Command | `npm install` |
| Start Command | `node index.js` |
| Env Variables | `SUPABASE_URL`, `SUPABASE_KEY` |

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
