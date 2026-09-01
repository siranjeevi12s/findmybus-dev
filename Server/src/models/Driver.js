const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    licenseExpiryDate: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyContact: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
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

// Ensure licenseNumber is unique per school, ignoring deleted records
driverSchema.index(
  { schoolId: 1, licenseNumber: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['active', 'inactive'] } } }
);

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
