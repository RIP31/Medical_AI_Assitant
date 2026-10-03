const express = require('express');
const interactionController = require('../controllers/interactionController');

const router = express.Router();

router.post('/check', interactionController.checkInteractions);

module.exports = router;
