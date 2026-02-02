const express = require('express');
const router = express.Router();
const { followUser, getFollowers, getFollowing, getTasteMatch } = require('../controllers/socialController');

router.post('/follow', followUser);
router.get('/followers/:id', getFollowers);
router.get('/following/:id', getFollowing);
router.get('/taste-match', getTasteMatch);

module.exports = router;
