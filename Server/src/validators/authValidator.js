const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(1, 'School name is required').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters long'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be exactly 6 characters').regex(/^[0-9]+$/, 'OTP must contain only digits'),
});

const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
};
