const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// Apply protection middleware to all dashboard routes
router.use(protect);

router.get('/stats', dashboardController.getStats);

module.exports = router;
