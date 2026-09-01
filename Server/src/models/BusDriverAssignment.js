const mongoose = require('mongoose');

const busDriverAssignmentSchema = new mongoose.Schema(
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
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    unassignedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce that a driver can only have ONE active assignment at a time
busDriverAssignmentSchema.index(
  { schoolId: 1, driverId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

// Enforce that a bus can only have ONE active assignment at a time
busDriverAssignmentSchema.index(
  { schoolId: 1, busId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

const BusDriverAssignment = mongoose.model(
  'BusDriverAssignment',
  busDriverAssignmentSchema
);

module.exports = BusDriverAssignment;
