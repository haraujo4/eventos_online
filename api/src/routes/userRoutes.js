const express = require('express');
const router = express.Router();
const container = require('../container');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const upload = require('../middlewares/uploadMiddleware');


router.get('/', authenticate, authorize(['admin']), (req, res) => container.userController.getAll(req, res));
router.patch('/:id/status', authenticate, authorize(['admin']), (req, res) => container.userController.updateStatus(req, res));
router.get('/import/template', authenticate, authorize(['admin']), (req, res) => container.userController.downloadTemplate(req, res));
router.post('/import', authenticate, authorize(['admin']), upload.single('file'), (req, res) => container.userController.importUsers(req, res));
router.get('/export', authenticate, authorize(['admin']), (req, res) => container.userController.exportUsers(req, res));


router.post('/', authenticate, authorize(['admin']), (req, res) => container.userController.create(req, res));
router.put('/:id', authenticate, authorize(['admin']), (req, res) => container.userController.update(req, res));

module.exports = router;
