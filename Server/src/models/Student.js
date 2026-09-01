const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    parentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    parentPhone: {
      type: String,
      required: true,
      trim: true,
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      default: null,
      index: true,
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

// Ensure studentId is unique per school, ignoring deleted records
studentSchema.index(
  { schoolId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['active', 'inactive'] } } }
);

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
