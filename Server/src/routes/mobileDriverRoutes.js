const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const mobileDriverController = require('../controllers/mobileDriverController');
const { locationUpdateSchema } = require('../validators/tripValidator');
const { mobileProtect } = require('../middleware/mobileAuth');
const { createRateLimiter } = require('../middleware/rateLimit');

// Ensure role is driver
const driverGuard = (req, res, next) => {
  if (req.mobileUser.role !== 'driver') {
    return res.status(403).json({ success: false, message: 'Forbidden: Drivers only', data: null, error: null });
  }
  next();
};

// Per-driver trip-start limit: prevents rapid duplicate start attempts while
// allowing normal operation (30 per minute per driver).
const tripStartLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  keyFn: (req) => `driver:${req.mobileUser?.userId ?? req.ip}`,
});

router.use(mobileProtect);
router.use(driverGuard);

router.get('/profile', mobileDriverController.getProfile);
router.get('/assignment', mobileDriverController.getAssignment);
router.get('/trips/current', mobileDriverController.getCurrentTrip);
router.post('/trips/start', tripStartLimiter, mobileDriverController.startTrip);
router.post('/trips/:tripId/location', validate(locationUpdateSchema), mobileDriverController.updateLocation);
router.post('/trips/:tripId/stop', mobileDriverController.stopTrip);

module.exports = router;
