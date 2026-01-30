const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post('/', authenticate, questionController.addQuestion);

// Admin/Moderator routes
router.get('/', authenticate, authorize(['admin', 'moderator']), questionController.getQuestions);
router.put('/:id/display', authenticate, authorize(['admin', 'moderator']), questionController.displayQuestion);
router.delete('/:id', authenticate, authorize(['admin', 'moderator']), questionController.deleteQuestion);

module.exports = router;
