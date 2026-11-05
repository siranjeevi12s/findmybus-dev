const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const mobileAuthController = require('../controllers/mobileAuthController');
const { sendOtpSchema, verifyOtpSchema, resendOtpSchema } = require('../validators/mobileAuthValidator');
const { mobileProtect } = require('../middleware/mobileAuth');
const { createRateLimiter } = require('../middleware/rateLimit');

// Coarse per-IP limits on unauthenticated auth endpoints (the per-email OTP
// throttle in mobileAuthService still applies on top of these).
const ipKey = (req) => req.ip;
const sendOtpLimiter = createRateLimiter({ windowMs: 60_000, max: 10, keyFn: ipKey });
const verifyOtpLimiter = createRateLimiter({ windowMs: 60_000, max: 20, keyFn: ipKey });
const resendOtpLimiter = createRateLimiter({ windowMs: 60_000, max: 10, keyFn: ipKey });
const refreshLimiter = createRateLimiter({ windowMs: 60_000, max: 30, keyFn: ipKey });

router.post('/send-otp', sendOtpLimiter, validate(sendOtpSchema), mobileAuthController.sendOtp);
router.post('/verify-otp', verifyOtpLimiter, validate(verifyOtpSchema), mobileAuthController.verifyOtp);
router.post('/resend-otp', resendOtpLimiter, validate(resendOtpSchema), mobileAuthController.resendOtp);
router.post('/refresh-token', refreshLimiter, mobileAuthController.refreshToken);
router.post('/logout', mobileProtect, mobileAuthController.logout);
router.get('/me', mobileProtect, mobileAuthController.getMe);

module.exports = router;
