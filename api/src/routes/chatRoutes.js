const express = require('express');
const router = express.Router();
const container = require('../container');
const { authenticate, authorize } = require('../middlewares/authMiddleware');


// Public/User routes
router.get('/', authenticate, (req, res) => container.chatController.getHistory(req, res));
router.post('/', authenticate, (req, res) => container.chatController.create(req, res));

// Admin/Moderator routes
router.get('/pending', authenticate, authorize(['admin', 'moderator']), (req, res) => container.chatController.getPending(req, res));
router.get('/export', authenticate, authorize(['admin', 'moderator']), (req, res) => container.chatController.export(req, res));
router.delete('/:id', authenticate, authorize(['admin', 'moderator']), (req, res) => container.chatController.delete(req, res));
router.post('/users/:userId/ban', authenticate, authorize(['admin', 'moderator']), (req, res) => container.chatController.banUser(req, res));
router.post('/users/:userId/unban', authenticate, authorize(['admin', 'moderator']), (req, res) => container.chatController.unbanUser(req, res));
router.put('/:id/highlight', authenticate, authorize(['admin', 'moderator']), (req, res) => container.chatController.toggleHighlight(req, res));
router.put('/:id/approve', authenticate, authorize(['admin', 'moderator']), (req, res) => container.chatController.approve(req, res));

module.exports = router;
