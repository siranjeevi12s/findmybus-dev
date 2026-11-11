const express = require('express');
const router = express.Router();
const mobileParentController = require('../controllers/mobileParentController');
const validate = require('../middleware/validate');
const { registerStudentSchema } = require('../validators/mobileRegisterStudentValidator');
const { mobileProtect } = require('../middleware/mobileAuth');
const { createRateLimiter } = require('../middleware/rateLimit');

// Ensure role is parent
const parentGuard = (req, res, next) => {
  if (req.mobileUser.role !== 'parent') {
    return res.status(403).json({ success: false, message: 'Forbidden: Parents only', data: null, error: null });
  }
  next();
};

// Public: student registration must be reachable before the parent has a token.
// Rate-limited to blunt mass-registration / data-injection abuse.
const registerLimiter = createRateLimiter({ windowMs: 60_000, max: 5, keyFn: (req) => req.ip });
router.post('/student', registerLimiter, validate(registerStudentSchema), mobileParentController.registerStudent);

router.use(mobileProtect);
router.use(parentGuard);

router.get('/profile', mobileParentController.getProfile);
router.get('/student', mobileParentController.getStudent);
router.get('/bus', mobileParentController.getBus);
router.get('/active-trip', mobileParentController.getActiveTrip);
router.get('/bus-location', mobileParentController.getBusLocation);
router.get('/trip-locations', mobileParentController.getTripPath);

module.exports = router;
