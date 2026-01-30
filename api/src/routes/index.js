const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const mediaRoutes = require('./mediaRoutes');
const userRoutes = require('./userRoutes');
const chatRoutes = require('./chatRoutes');
const statsRoutes = require('./statsRoutes');
const eventRoutes = require('./eventRoutes');
const reactionRoutes = require('./reactionRoutes');
const pollRoutes = require('./pollRoutes');
const commentRoutes = require('./commentRoutes');
const questionRoutes = require('./questionRoutes');


router.use('/auth', authRoutes);
router.use('/media', mediaRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/stats', statsRoutes);
router.use('/reactions', reactionRoutes);
router.use('/polls', pollRoutes);
router.use('/comments', commentRoutes);
router.use('/questions', questionRoutes);
router.use('/', eventRoutes);

router.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

module.exports = router;
