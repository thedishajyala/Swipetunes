const express = require('express');
const router = express.Router();
const { followUser, unfollowUser, getFollowers, getFollowing, getTasteMatch } = require('../controllers/socialController');

router.post('/follow', followUser);
router.delete('/follow', unfollowUser);
router.get('/followers/:id', getFollowers);
router.get('/following/:id', getFollowing);
router.get('/taste-match', getTasteMatch);

module.exports = router;
