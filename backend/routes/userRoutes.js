const express = require('express');
const router = express.Router();
const { getAllUsers, getUserProfile } = require('../controllers/userController');

router.get('/', getAllUsers);
router.get('/:id', getUserProfile);

module.exports = router;
