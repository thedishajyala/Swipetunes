# 🎵 SwipeTunes

> The Tinder for Music Discovery.

SwipeTunes is a full-stack music discovery application that lets you explore new tracks with a fun, gesture-based interface. Connect your Spotify account, swipe right to like, left to pass, and build your music identity.

![SwipeTunes Demo](https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop)

## 🏗 Architecture

SwipeTunes uses a modern **3-Tier Architecture**:

1.  **Frontend**: [Next.js](https://nextjs.org/) (React) - Handles UI, Animations (Framer Motion), and Authentication.
2.  **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) - Process business logic and manages data.
3.  **Database**: [Supabase](https://supabase.com/) (PostgreSQL) - Stores user profiles, swipe history, and song metadata.

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

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
