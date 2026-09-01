const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const mobileDriverController = require('../controllers/mobileDriverController');
const { locationUpdateSchema } = require('../validators/tripValidator');
const { mobileProtect } = require('../middleware/mobileAuth');

// Ensure role is driver
const driverGuard = (req, res, next) => {
  if (req.mobileUser.role !== 'driver') {
    return res.status(403).json({ success: false, message: 'Forbidden: Drivers only', data: null, error: null });
  }
  next();
};

router.use(mobileProtect);
router.use(driverGuard);

router.get('/profile', mobileDriverController.getProfile);
router.get('/assignment', mobileDriverController.getAssignment);
router.get('/trips/current', mobileDriverController.getCurrentTrip);
router.post('/trips/start', mobileDriverController.startTrip);
router.post('/trips/:tripId/location', validate(locationUpdateSchema), mobileDriverController.updateLocation);
router.post('/trips/:tripId/stop', mobileDriverController.stopTrip);

module.exports = router;
