const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const mediaRoutes = require('./mediaRoutes');
const userRoutes = require('./userRoutes');
const chatRoutes = require('./chatRoutes');
const statsRoutes = require('./statsRoutes');
const eventRoutes = require('./eventRoutes');


router.use('/auth', authRoutes);
router.use('/media', mediaRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/stats', statsRoutes);
router.use('/', eventRoutes); 

router.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

module.exports = router;
