const express = require('express');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.get('/status', chatController.getStatus);
router.post('/', chatController.generateResponse);

module.exports = router;
