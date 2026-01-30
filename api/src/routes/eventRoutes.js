const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const upload = require('../middlewares/uploadMiddleware'); 
const { authenticate, authorize } = require('../middlewares/authMiddleware');


router.get('/settings', eventController.getSettings);


router.put('/settings', authenticate, authorize(['admin']), eventController.updateSettings);
router.put('/auth-fields', authenticate, authorize(['admin']), eventController.updateAuthFields);
router.post('/logo', authenticate, authorize(['admin']), upload.single('logo'), eventController.uploadLogo);

module.exports = router;
