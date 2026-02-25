# 🎵 SwipeTunes

> **Tinder for Music Discovery** — Swipe. Like. Vibe.

SwipeTunes is a full-stack music discovery app powered by the **Spotify API**. Authenticate with your Spotify account, get personalized song recommendations, and swipe through tracks like dating cards — right to like, left to pass. Your taste shapes your profile, builds your playlists, and lets you connect with people who match your music DNA.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Backend](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![Database](https://img.shields.io/badge/Supabase-PostgreSQL-blue?logo=supabase)
![Auth](https://img.shields.io/badge/Auth-Spotify_OAuth-1DB954?logo=spotify)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎧 **Spotify OAuth Login** | Sign in with your Spotify account — no separate registration needed |
| 🃏 **Swipe Interface** | Smooth, gesture-driven card stack powered by Framer Motion |
| 🔊 **30s Audio Previews** | Listen to a track snippet directly on the swipe card before deciding |
| 💚 **Like & Pass** | Swipe right to like, left to pass — every action shapes your recommendations |
| 📜 **Swipe History** | Review all your past liked and passed tracks in one view |
| 🔥 **Trending Playlists** | Browse daily auto-generated playlists built from popular swipe data |
| 🤝 **Taste Match** | Calculate your music compatibility % with other users |
| 👥 **Social — Follow Users** | Follow other music lovers and explore their profiles |
| 🏆 **Leaderboard** | See the top users and most-liked tracks on the platform |
| 🎨 **Artist Discovery** | Drill into artist pages and explore their discography |
| 🎖️ **Daily Streak & Badges** | Stay consistent — earn streak rewards and unlock achievement badges |

---

## 🏗️ Architecture

SwipeTunes follows a clean **3-Tier Monorepo** architecture:

```
┌─────────────────────┐        ┌──────────────────────┐        ┌──────────────────┐
│   Next.js Frontend  │◄─HTTPS►│  Node.js Express API │◄─TCP──►│ Supabase (Postgres)│
│     (Port 3000)     │        │     (Port 5001)      │        │   Cloud DB       │
└─────────────────────┘        └──────────────────────┘        └──────────────────┘
```

### Backend MVC Structure

```
backend/
├── controllers/    # Business logic (swipe actions, playlists, social)
├── routes/         # API endpoint definitions
│   ├── actionRoutes.js    # Swipe recording & playlist triggers
│   ├── playlistRoutes.js  # Trending & user playlists
│   ├── socialRoutes.js    # Follow, taste-match
│   └── userRoutes.js      # User data
├── middleware/     # Zod validation, error handling, logging
└── db/             # Supabase client + optimized SQL indexes
```

### Key API Endpoints

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Action** | POST | `/action` | Records swipe & triggers daily playlist generation |
| **Playlist** | GET | `/playlists/trending` | Returns top community playlists |
| **Social** | POST | `/follow` | Follow another user |
| **Social** | GET | `/taste-match` | Returns music compatibility % between two users |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TailwindCSS v4, Framer Motion |
| **Auth** | NextAuth.js v4 with Spotify OAuth provider |
| **Backend** | Node.js, Express |
| **Database** | Supabase (PostgreSQL) |
| **Music API** | Spotify Web API |
| **UI Extras** | React Icons, React Hot Toast |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- A **Spotify Developer** account → [Create an app](https://developer.spotify.com/dashboard)
- A **Supabase** project → [supabase.com](https://supabase.com)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/swipetunes.git
cd swipetunes
```

### 2. Install all dependencies

```bash
npm run install:all
```

This installs dependencies for the root, frontend, and backend in one step.

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

Or run them individually:

```bash
npm run dev:frontend   # Next.js only
npm run dev:backend    # Express API only
```

---

## ☁️ Deployment

### Frontend → Vercel

Since this is a monorepo, tell Vercel to look inside the `frontend/` folder:

1. Go to **Project Settings → General**
2. Under **Root Directory**, click **Edit** and set it to: `frontend`
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

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the [MIT License](https://choosealicense.com/licenses/mit/).

---

<p align="center">Made with ❤️ and 🎵 by <a href="https://github.com/thedishajyala">Disha Jyala</a></p>
