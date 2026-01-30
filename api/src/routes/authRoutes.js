const express = require('express');
const router = express.Router();
const container = require('../container');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/login', (req, res) => container.authController.login(req, res));
router.post('/register', (req, res) => container.authController.register(req, res));
router.get('/me', authenticate, (req, res) => container.authController.me(req, res));
router.post('/verify-2fa', (req, res) => container.authController.verify2FA(req, res));

module.exports = router;
