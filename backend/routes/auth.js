const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authController.getProfile);
router.post('/change-password', authController.changePassword);
router.post('/ack-privacy-reset', authController.acknowledgePrivacyReset);

module.exports = router;
