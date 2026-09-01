const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    busNumber: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
    },
    busType: {
      type: String,
      enum: ['Standard', 'Minibus', 'Coach'],
      default: 'Standard',
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
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

// Ensure busNumber and registrationNumber are unique per school, but ignore deleted records for uniqueness checks
// Since MongoDB unique indexes apply to all documents, we can create partial filter indexes so that deleted documents
// do not conflict with new ones.
busSchema.index(
  { schoolId: 1, busNumber: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['active', 'inactive'] } } }
);

busSchema.index(
  { schoolId: 1, registrationNumber: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['active', 'inactive'] } } }
);

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;
