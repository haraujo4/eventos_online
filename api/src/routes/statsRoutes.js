const express = require('express');
const router = express.Router();
const container = require('../container');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, authorize(['admin']), (req, res) => container.statsController.getStats(req, res));
router.get('/history', authenticate, authorize(['admin']), (req, res) => container.statsController.getHistory(req, res));
router.get('/audience/export', authenticate, authorize(['admin']), (req, res) => container.statsController.exportAudienceReport(req, res));

module.exports = router;
