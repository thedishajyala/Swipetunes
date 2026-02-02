const express = require('express');
const router = express.Router();
const { handleAction, actionSchema } = require('../controllers/actionController');
const { validateObj } = require('../middleware/validation');

router.post('/', validateObj(actionSchema), handleAction);

module.exports = router;
