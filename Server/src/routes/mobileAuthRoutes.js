const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const mobileAuthController = require('../controllers/mobileAuthController');
const { sendOtpSchema, verifyOtpSchema, resendOtpSchema } = require('../validators/mobileAuthValidator');
const { mobileProtect } = require('../middleware/mobileAuth');

router.post('/send-otp', validate(sendOtpSchema), mobileAuthController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), mobileAuthController.verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), mobileAuthController.resendOtp);
router.post('/refresh-token', mobileAuthController.refreshToken);
router.post('/logout', mobileProtect, mobileAuthController.logout);
router.get('/me', mobileProtect, mobileAuthController.getMe);

module.exports = router;
