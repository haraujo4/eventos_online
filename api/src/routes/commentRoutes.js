const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/stream/:streamId', authenticate, commentController.getComments);
router.post('/', authenticate, commentController.addComment);
router.post('/react', authenticate, commentController.reactToComment);

// Admin/Moderator routes
router.get('/pending', authenticate, authorize(['admin', 'moderator']), commentController.getPendingComments);
router.put('/:id/approve', authenticate, authorize(['admin', 'moderator']), commentController.approveComment);
router.delete('/:id', authenticate, authorize(['admin', 'moderator']), commentController.deleteComment);

module.exports = router;
