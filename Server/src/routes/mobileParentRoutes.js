const express = require('express');
const router = express.Router();
const mobileParentController = require('../controllers/mobileParentController');
const { mobileProtect } = require('../middleware/mobileAuth');

// Ensure role is parent
const parentGuard = (req, res, next) => {
  if (req.mobileUser.role !== 'parent') {
    return res.status(403).json({ success: false, message: 'Forbidden: Parents only', data: null, error: null });
  }
  next();
};

router.use(mobileProtect);
router.use(parentGuard);

router.get('/profile', mobileParentController.getProfile);
router.get('/student', mobileParentController.getStudent);
router.get('/bus', mobileParentController.getBus);
router.get('/active-trip', mobileParentController.getActiveTrip);
router.get('/bus-location', mobileParentController.getBusLocation);
router.get('/bus-location-history', mobileParentController.getBusLocationHistory);

module.exports = router;
