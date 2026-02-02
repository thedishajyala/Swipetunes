const express = require('express');
const router = express.Router();
const { getTodayPlaylist, getUserPlaylists, viewPlaylist, getTrending } = require('../controllers/playlistController');

// Trending needs to be before /:id to not clash if we didn't use prefixes, but here we will mount on /playlist or similar.
// Actually, trending is /playlists/trending vs /playlist/:id in old code. 
// We will structure clean.
// In index.js we will likely mount:
// /playlist -> playlistRoutes ??
// Wait, old API:
// /playlist/today/:id
// /playlist/user/:id
// /playlist/view/:id
// /playlists/trending  <-- Different base
// To keep compatibility, we might need flexible routing or mount points.

router.get('/today/:id', getTodayPlaylist);
router.get('/user/:id', getUserPlaylists);
router.get('/view/:id', viewPlaylist);
// We will mount Trending separately or here and handle path in index.js
router.get('/trending', getTrending);

module.exports = router;
