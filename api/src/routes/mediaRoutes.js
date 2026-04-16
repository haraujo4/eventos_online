const express = require('express');
const router = express.Router();
const container = require('../container'); 
const upload = require('../middlewares/uploadMiddleware');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const cpUpload = upload.fields([{ name: 'video', maxCount: 1 }, { name: 'poster', maxCount: 1 }]);


router.get('/', (req, res) => container.mediaController.getAll(req, res));
router.get('/:id', (req, res) => container.mediaController.getById(req, res));
router.post('/', authenticate, authorize(['admin']), upload.any(), (req, res) => container.mediaController.create(req, res));
router.put('/:id', authenticate, authorize(['admin']), upload.any(), (req, res) => container.mediaController.update(req, res));
router.delete('/:id', authenticate, authorize(['admin']), (req, res) => container.mediaController.delete(req, res));
router.post('/live', authenticate, authorize(['admin']), (req, res) => container.mediaController.toggleLive(req, res));
router.patch('/:id/live', authenticate, authorize(['admin']), (req, res) => container.mediaController.toggleEventLive(req, res));

module.exports = router;
