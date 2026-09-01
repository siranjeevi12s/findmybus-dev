const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Exclude passwordHash by default when converting to JSON
schoolSchema.methods.toJSON = function () {
  const school = this.toObject();
  delete school.passwordHash;
  return school;
};

const School = mongoose.model('School', schoolSchema);

module.exports = School;
