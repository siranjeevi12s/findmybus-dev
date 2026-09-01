const { z } = require('zod');

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^[0-9]+$/),
});

const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

module.exports = { sendOtpSchema, verifyOtpSchema, resendOtpSchema };
