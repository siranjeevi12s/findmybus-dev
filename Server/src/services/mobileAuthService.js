const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const MobileOtp = require('../models/MobileOtp');
const MobileSession = require('../models/MobileSession');
const Driver = require('../models/Driver');
const Student = require('../models/Student');
const { generateMobileAccessToken, generateMobileRefreshToken, verifyMobileRefreshToken } = require('../utils/mobileJwt');

// Note: Ensure your emailService exports sendOtpEmail
// If it doesn't exist yet, we will mock it or you can replace it.
// Assuming we have some email service, but for now we'll just log it if not available.
let emailService;
try {
  emailService = require('./emailService');
} catch (e) {
  emailService = {
    sendOtpEmail: async (email, otp) => {
      console.log(`[DEV ONLY] Mock Email Sent to ${email} with OTP: ${otp}`);
    }
  };
}

const sendOtp = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Determine user role and ID
  let role = null;
  let userId = null;

  const driver = await Driver.findOne({ email: normalizedEmail, status: 'active' });
  if (driver) {
    role = 'driver';
    userId = driver._id;
  } else {
    // Note: ensure parentEmail is indexed in Student for performance if not already
    const student = await Student.findOne({ parentEmail: normalizedEmail, status: 'active' });
    if (student) {
      role = 'parent';
      userId = student._id; // We use student._id as the parent's userId reference
    }
  }

  if (!role || !userId) {
    const error = new Error('Email not registered. Contact your school administrator.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Delete existing OTP
  await MobileOtp.deleteMany({ email: normalizedEmail });

  // 3. Generate 6-digit OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  
  // 4. Hash OTP
  const otpHash = await bcrypt.hash(otpCode, 10);

  // 5. Save OTP
  const now = Date.now();
  await MobileOtp.create({
    email: normalizedEmail,
    otpHash,
    attempts: 0,
    resendTimeLimit: new Date(now + 60 * 1000), // 60 seconds throttle
    expiresAt: new Date(now + 10 * 60 * 1000), // 10 minutes expiry
  });

  // 6. Send Email
  if (emailService.sendOtpEmail) {
      await emailService.sendOtpEmail(normalizedEmail, otpCode);
  } else {
      console.log(`[DEV ONLY] OTP for ${normalizedEmail} is ${otpCode}`);
  }

  return { email: normalizedEmail, role, message: 'Verification code sent successfully' };
};

const verifyOtp = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await MobileOtp.findOne({ email: normalizedEmail });
  if (!otpRecord) {
    const error = new Error('OTP not found or expired');
    error.statusCode = 400;
    throw error;
  }

  if (otpRecord.attempts >= 5) {
    await MobileOtp.deleteOne({ _id: otpRecord._id });
    const error = new Error('Too many failed attempts. Please request a new OTP.');
    error.statusCode = 400;
    throw error;
  }

  otpRecord.attempts += 1;
  await otpRecord.save();

  const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isValid) {
    const error = new Error('Invalid verification code');
    error.statusCode = 400;
    throw error;
  }

  // Determine user again to ensure they still exist and are active
  let role = null;
  let userId = null;

  const driver = await Driver.findOne({ email: normalizedEmail, status: 'active' });
  if (driver) {
    role = 'driver';
    userId = driver._id;
  } else {
    const student = await Student.findOne({ parentEmail: normalizedEmail, status: 'active' });
    if (student) {
      role = 'parent';
      userId = student._id;
    }
  }

  if (!role || !userId) {
    const error = new Error('Account no longer exists or is inactive');
    error.statusCode = 404;
    throw error;
  }

  // OTP valid, cleanup
  await MobileOtp.deleteOne({ _id: otpRecord._id });

  // Generate Tokens
  const accessToken = generateMobileAccessToken(userId, role);
  const refreshToken = generateMobileRefreshToken(userId, role);

  // Save Session
  await MobileSession.create({
    userId,
    role,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return { userId, role, accessToken, refreshToken, email: normalizedEmail };
};

const resendOtp = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await MobileOtp.findOne({ email: normalizedEmail });
  if (!otpRecord) {
      // Just act like sendOtp if not found
      return sendOtp(normalizedEmail);
  }

  if (otpRecord.resendTimeLimit > new Date()) {
    const error = new Error('Please wait before requesting another OTP');
    error.statusCode = 429;
    throw error;
  }

  // Generate new OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otpCode, 10);

  const now = Date.now();
  otpRecord.otpHash = otpHash;
  otpRecord.attempts = 0;
  otpRecord.resendTimeLimit = new Date(now + 60 * 1000);
  otpRecord.expiresAt = new Date(now + 10 * 60 * 1000);
  await otpRecord.save();

  if (emailService.sendOtpEmail) {
    await emailService.sendOtpEmail(normalizedEmail, otpCode);
  } else {
    console.log(`[DEV ONLY] Resent OTP for ${normalizedEmail} is ${otpCode}`);
  }

  return { email: normalizedEmail, message: 'Verification code resent successfully' };
};

const refreshMobileToken = async (token) => {
  if (!token) {
      const err = new Error('Refresh token is required');
      err.statusCode = 400;
      throw err;
  }
  const decoded = verifyMobileRefreshToken(token);
  if (!decoded) {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const session = await MobileSession.findOne({ token });
  if (!session) {
    const err = new Error('Session expired or logged out');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = generateMobileAccessToken(session.userId, session.role);
  return { accessToken };
};

const logoutMobile = async (token) => {
  if (token) {
      await MobileSession.deleteOne({ token });
  }
  return { message: 'Logged out successfully' };
};

const getMobileMe = async (userId, role) => {
  if (role === 'driver') {
    const driver = await Driver.findById(userId).populate('schoolId', 'name email');
    if (!driver) {
        const err = new Error('Driver not found');
        err.statusCode = 404;
        throw err;
    }
    return {
      id: driver._id,
      role: 'driver',
      email: driver.email,
      firstName: driver.firstName,
      lastName: driver.lastName,
      phoneNumber: driver.phoneNumber,
      school: driver.schoolId,
    };
  } else if (role === 'parent') {
    const student = await Student.findById(userId).populate('schoolId', 'name email').populate('busId');
    if (!student) {
        const err = new Error('Student not found');
        err.statusCode = 404;
        throw err;
    }
    return {
      id: student._id,
      role: 'parent',
      email: student.parentEmail,
      parentName: student.parentName,
      studentName: student.studentName,
      studentId: student.studentId,
      grade: student.grade,
      section: student.section,
      school: student.schoolId,
      bus: student.busId
    };
  }
  const err = new Error('Invalid role');
  err.statusCode = 400;
  throw err;
};

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
  refreshMobileToken,
  logoutMobile,
  getMobileMe,
};
