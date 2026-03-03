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
const historyRoutes = require('./routes/historyRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Health Check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Route Mounting
// POST /action — Swipe/like action handler
app.use('/action', actionRoutes);

// GET /playlist/today/:id   — Today's daily playlist for a user
// GET /playlist/user/:id    — All playlists for a user
// GET /playlist/view/:id    — View a specific playlist (increments view count)
// GET /playlist/trending    — 20 most recently created playlists
// GET /playlists/trending   — Alias for frontend compatibility
app.use('/playlist', playlistRoutes);
app.use('/playlists', playlistRoutes);

// Social routes
// POST   /follow             — Follow a user
// DELETE /follow             — Unfollow a user
// GET    /followers/:id      — Get followers of user
// GET    /following/:id      — Get users that user follows
// GET    /taste-match        — Taste match score (?me=&other=)
app.use('/', socialRoutes);

// User routes
// GET /users                 — List all users (supports ?q= search and ?exclude= filter)
// GET /users/:id             — Get a single user profile
app.use('/users', userRoutes);

// History routes
// GET /history/:id           — Liked songs history for a user
// GET /history/:id/swipes    — Full swipe history (liked + noped)
app.use('/history', historyRoutes);

// Central Error Handler (Must be last)
app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 SwipeTunes Backend running on port ${PORT}`));
