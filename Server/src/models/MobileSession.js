const mongoose = require('mongoose');

const mobileSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['driver', 'parent'],
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index — auto-remove expired sessions
mobileSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MobileSession = mongoose.model('MobileSession', mobileSessionSchema);

module.exports = MobileSession;
