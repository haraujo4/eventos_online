const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const upload = require('../middlewares/uploadMiddleware');
const { authenticate, authorize } = require('../middlewares/authMiddleware');


router.get('/settings', eventController.getSettings);


router.put('/settings', authenticate, authorize(['admin']), eventController.updateSettings);
router.put('/auth-fields', authenticate, authorize(['admin']), eventController.updateAuthFields);
router.post('/logo', authenticate, authorize(['admin']), upload.single('logo'), eventController.uploadLogo);
router.post('/background', authenticate, authorize(['admin']), upload.single('background'), eventController.uploadBackground);
router.delete('/background', authenticate, authorize(['admin']), eventController.removeBackground);
router.delete('/settings/reset', authenticate, authorize(['admin']), eventController.resetEvent);

module.exports = router;
