const bcrypt = require('bcryptjs');
const School = require('../models/School');
const Otp = require('../models/Otp');
const RefreshToken = require('../models/RefreshToken');
const { sendOtpEmail } = require('./emailService');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

/**
 * Register a new school (generates OTP)
 */
const registerSchool = async ({ name, email, password }) => {
  // Check if school already exists and is verified
  const existingSchool = await School.findOne({ email, status: { $ne: 'deleted' } });
  if (existingSchool) {
    const err = new Error('School email already registered');
    err.statusCode = 409;
    throw err;
  }

  // Delete any stale OTP requests for this email
  await Otp.deleteMany({ email });

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otpCode, 10);
  const passwordHash = await bcrypt.hash(password, 10);

  // Set limits
  const resendTimeLimit = new Date(Date.now() + 60 * 1000); // 1 minute throttle
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  // Save temporary registration data inside the OTP document
  const otpDoc = new Otp({
    email,
    otpHash,
    name,
    passwordHash,
    resendTimeLimit,
    expiresAt,
  });

  await otpDoc.save();

  // Send the email containing the OTP
  await sendOtpEmail(email, otpCode);

  return {
    email,
    message: 'Verification code sent to email',
  };
};

/**
 * Verify email OTP and create School record
 */
const verifyOtp = async ({ email, otp }) => {
  const otpRecord = await Otp.findOne({ email });
  if (!otpRecord) {
    const err = new Error('Verification code not found or expired');
    err.statusCode = 400;
    throw err;
  }

  // Check attempt limit (max 5)
  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ email });
    const err = new Error('Too many failed verification attempts. Please register again.');
    err.statusCode = 400;
    throw err;
  }

  // Increment attempts
  otpRecord.attempts += 1;
  await otpRecord.save();

  // Verify OTP code
  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) {
    const err = new Error('Invalid verification code');
    err.statusCode = 400;
    throw err;
  }

  // Create the permanent verified School account
  const school = new School({
    name: otpRecord.name,
    email: otpRecord.email,
    passwordHash: otpRecord.passwordHash,
    emailVerified: true,
  });

  await school.save();

  // Clean up OTP record
  await Otp.deleteOne({ email });

  // Generate tokens
  const accessToken = generateAccessToken(school._id);
  const refreshToken = generateRefreshToken(school._id);

  // Store refresh token
  const rTokenDoc = new RefreshToken({
    schoolId: school._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  await rTokenDoc.save();

  return {
    school,
    accessToken,
    refreshToken,
  };
};

/**
 * Resend OTP code with throttling check
 */
const resendOtp = async ({ email }) => {
  const otpRecord = await Otp.findOne({ email });
  if (!otpRecord) {
    const err = new Error('No active registration session found for this email');
    err.statusCode = 400;
    throw err;
  }

  // Check throttle limit
  if (new Date() < otpRecord.resendTimeLimit) {
    const secondsLeft = Math.ceil((otpRecord.resendTimeLimit - new Date()) / 1000);
    const err = new Error(`Please wait ${secondsLeft} second(s) before requesting another code`);
    err.statusCode = 429;
    throw err;
  }

  // Generate new OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otpCode, 10);

  // Update record
  otpRecord.otpHash = otpHash;
  otpRecord.attempts = 0;
  otpRecord.resendTimeLimit = new Date(Date.now() + 60 * 1000);
  otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await otpRecord.save();

  // Send the email containing the OTP
  await sendOtpEmail(email, otpCode);

  return {
    email,
    message: 'Verification code resent successfully',
  };
};

/**
 * Login administrator
 */
const loginSchool = async ({ email, password }) => {
  const school = await School.findOne({ email, status: 'active' });
  if (!school) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, school.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // Generate tokens
  const accessToken = generateAccessToken(school._id);
  const refreshToken = generateRefreshToken(school._id);

  // Store refresh token
  const rTokenDoc = new RefreshToken({
    schoolId: school._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  await rTokenDoc.save();

  return {
    school,
    accessToken,
    refreshToken,
  };
};

/**
 * Rotate Access Token via Refresh Token
 */
const rotateToken = async (token) => {
  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  const tokenDoc = await RefreshToken.findOne({ token });
  if (!tokenDoc) {
    const err = new Error('Session expired or revoked');
    err.statusCode = 401;
    throw err;
  }

  // Check if school is still active
  const school = await School.findOne({ _id: decoded.schoolId, status: 'active' });
  if (!school) {
    const err = new Error('School account is deactivated');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = generateAccessToken(school._id);
  return { accessToken };
};

/**
 * Invalidate refresh token on logout
 */
const logoutSchool = async (token) => {
  await RefreshToken.deleteOne({ token });
  return { message: 'Logged out successfully' };
};

module.exports = {
  registerSchool,
  verifyOtp,
  resendOtp,
  loginSchool,
  rotateToken,
  logoutSchool,
};
