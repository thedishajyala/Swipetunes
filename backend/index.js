const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const actionRoutes = require('./routes/actionRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const socialRoutes = require('./routes/socialRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(logger); // Request logging

// Route Mounting
app.use('/action', actionRoutes);

// Playlist Routes Mapping
// Old API: /playlist/today|user|view  AND /playlists/trending
// We can mount playlistRoutes on /playlist
app.use('/playlist', playlistRoutes);
// Trending was /playlists/trending
app.use('/playlists', playlistRoutes); // This allows /playlists/trending to work if route matches

// Social Routes Mapping
// Old API: /follow, /others on root? No, we had /follow, /following/:id on root.
// To keep exact compatibility we might need to mount on root or refactor frontend.
// Let's mount on /api and root for compatibility or just root.
// The user asked for "routes/follows.js", implying clean structure.
// I will mount them on root to match existing frontend calls, or cleaner prefixes.
// Frontend calls: /follow, /taste-match, /users.
app.use('/', socialRoutes); // Mounts /follow, /followers, /taste-match on root
app.use('/users', userRoutes); // Mounts /users

// Health Check
app.get("/", (req, res) => {
    res.send("SwipeTunes Backend (MVC Refactored) is running 🚀");
});

// Central Error Handler (Must be last)
app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
