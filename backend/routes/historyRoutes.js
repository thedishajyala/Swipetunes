const express = require('express');
const router = express.Router();
const { getHistory, getSwipeHistory } = require('../controllers/historyController');

router.get('/:id', getHistory);
router.get('/:id/swipes', getSwipeHistory);

module.exports = router;
