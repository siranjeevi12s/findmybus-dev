const mongoose = require('mongoose');

const mobileOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    resendTimeLimit: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-deletes expired OTPs
mobileOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MobileOtp = mongoose.model('MobileOtp', mobileOtpSchema);

module.exports = MobileOtp;
