const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reactionController');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/', authenticate, reactionController.addOrUpdateReaction);
router.delete('/', authenticate, reactionController.removeReaction);
router.get('/report', authenticate, reactionController.getReport);
router.get('/:streamId', authenticate, reactionController.getStats);

module.exports = router;
