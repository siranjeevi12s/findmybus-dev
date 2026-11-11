const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} = require('../validators/authValidator');

// Coarse per-IP limits on unauthenticated admin auth endpoints to blunt
// password brute force, OTP guessing and registration/email spam. (The mobile
// auth routes already have equivalent limits; admin previously had none.)
const ipKey = (req) => req.ip;
const registerLimiter = createRateLimiter({ windowMs: 60_000, max: 10, keyFn: ipKey });
const verifyOtpLimiter = createRateLimiter({ windowMs: 60_000, max: 20, keyFn: ipKey });
const resendOtpLimiter = createRateLimiter({ windowMs: 60_000, max: 10, keyFn: ipKey });
const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 10, keyFn: ipKey });
const refreshLimiter = createRateLimiter({ windowMs: 60_000, max: 30, keyFn: ipKey });

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', verifyOtpLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', resendOtpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', refreshLimiter, authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
