const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
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
  {
    timestamps: true,
  }
);

// TTL index to automatically remove expired OTP records
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
