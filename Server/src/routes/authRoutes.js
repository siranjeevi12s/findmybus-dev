const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} = require('../validators/authValidator');

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), authController.resendOtp);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
