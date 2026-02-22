# 🎵 SwipeTunes

> The Tinder for Music Discovery.

SwipeTunes is a full-stack music discovery application that lets you explore new tracks with a fun, gesture-based interface. Connect your Spotify account, swipe right to like, left to pass, and build your music identity.

![SwipeTunes Demo](https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop)

## 🏗 Architecture

**SwipeTunes** uses a robust 3-Tier Architecture designed for scalability and performance.

### System Design
```
[Next.js Frontend]  <--HTTPS-->  [Node.js Express API]  <--TCP-->  [Supabase PostgreSQL]
(Vercel)                         (Render/Railway)               (Supabase Cloud)
```

### Backend Structure (MVC)
The backend is engineered for maintainability and separation of concerns:
- **Controllers**: Business logic (e.g., `playlistController.js` handles daily playlist generation).
- **Routes**: API endpoint definitions.
- **Middleware**: Centralized validation (`zod`), error handling, and logging.
- **DB**: Performance optimized with SQL indexes.

### Key API Endpoints
| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Action** | POST | `/action` | Records swipes/likes & auto-generates daily playlists |
| **Social** | POST | `/follow` | Follow a user |
| **Social** | GET | `/taste-match` | Calculates music compatibility % |
| **Data** | GET | `/playlists/trending` | Returns top daily playlists |

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- Spotify Developer Account (for API keys)
- Supabase Project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/swipetunes.git
    cd swipetunes
    ```

2.  **Install Dependencies**
    We have a helper script to install dependencies for both frontend and backend:
    ```bash
    npm run install:all
    ```

### Configuration

You need to set up environment variables for both Frontend and Backend.

**Frontend (`frontend/.env`)**
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
```

**Backend (`backend/.env`)**
```env
PORT=5001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

### Running the App

Start both the Frontend (Port 3000) and Backend (Port 5001) with a single command:

```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5001](http://localhost:5001)

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, Framer Motion, NextAuth.js
- **Backend**: Node.js, Express, Supabase Client
- **Database**: Supabase (PostgreSQL)
- **APIs**: Spotify Web API

## ✨ Features

- **Spotify Integration**: Login with Spotify to fetch your recommendations.
- **Swipe Interface**: Smooth, gesture-driven card stack for discovering songs.
- **Real-time History**: Liked songs are instantly saved to your history.
- **Smart Recommendations**: Algorithmic suggestions based on your listening habits.
- **Audio Previews**: Listen to 30s previews directly on the card.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## ☁️ Deployment

### Deploying Frontend (Vercel)
Since this is a monorepo, you must configure Vercel to look in the `frontend` folder.
1.  Go to **Settings** > **General**.
2.  Find **Root Directory** section.
3.  Click **Edit** and set it to: `frontend`.
4.  Save and Redeploy.

### Deploying Backend (Render/Railway)
Deploy the `backend` folder as a separate web service.
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Environment Variables**: Add `SUPABASE_URL` and `SUPABASE_KEY`.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
