const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/active', authenticate, pollController.getActivePoll);
router.post('/vote', authenticate, pollController.vote);

// Admin routes
router.get('/', authenticate, authorize(['admin']), pollController.getAllPolls);
router.get('/votes/report', authenticate, authorize(['admin']), pollController.getVotesReport);
router.post('/', authenticate, authorize(['admin']), pollController.createPoll);
router.put('/:id/status', authenticate, authorize(['admin']), pollController.toggleStatus);
router.delete('/:id', authenticate, authorize(['admin']), pollController.deletePoll);

module.exports = router;
