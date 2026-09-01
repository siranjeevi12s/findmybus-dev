const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    // Latest GPS coordinates (updated in-place on each location push)
    currentLatitude: { type: Number },
    currentLongitude: { type: Number },
    currentAccuracy: { type: Number },
    currentSpeed: { type: Number },
    currentHeading: { type: Number },
    locationUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

// Query indexes for common lookups
tripSchema.index({ driverId: 1, status: 1 });
tripSchema.index({ busId: 1, status: 1 });

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
