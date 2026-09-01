const Student = require('../models/Student');
const Bus = require('../models/Bus');

/**
 * Create a new student
 */
const createStudent = async (schoolId, studentData) => {
  const { studentId, busId } = studentData;

  // 1. Verify studentId is unique within this school
  const duplicate = await Student.findOne({
    schoolId,
    studentId,
    status: { $ne: 'deleted' },
  });

  if (duplicate) {
    const err = new Error(`Student with ID "${studentId}" already exists for this school`);
    err.statusCode = 409;
    throw err;
  }

  // 2. Verify bus belongs to this school if provided
  if (busId) {
    const busExists = await Bus.findOne({ _id: busId, schoolId, status: 'active' });
    if (!busExists) {
      const err = new Error('Assigned bus not found or deactivated');
      err.statusCode = 400;
      throw err;
    }
  }

  const student = new Student({
    ...studentData,
    schoolId,
  });

  await student.save();
  return await Student.findById(student._id).populate('busId');
};

/**
 * Get all students (paginated + searchable + populated)
 */
const getStudents = async (schoolId, { page = 1, limit = 10, search = '' }) => {
  const query = {
    schoolId,
    status: { $ne: 'deleted' },
  };

  if (search) {
    query.$or = [
      { studentName: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { parentName: { $regex: search, $options: 'i' } },
      { parentEmail: { $regex: search, $options: 'i' } },
      { parentPhone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('busId')
    .lean();

  return {
    students,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single student details
 */
const getStudentById = async (schoolId, studentId) => {
  const student = await Student.findOne({ _id: studentId, schoolId, status: { $ne: 'deleted' } })
    .populate('busId')
    .lean();

  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  return student;
};

/**
 * Update student details
 */
const updateStudent = async (schoolId, studentId, updateData) => {
  const student = await Student.findOne({ _id: studentId, schoolId, status: { $ne: 'deleted' } });
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  const { studentId: newStudentId, busId } = updateData;

  // Check studentId uniqueness if updated
  if (newStudentId && newStudentId !== student.studentId) {
    const duplicate = await Student.findOne({
      schoolId,
      studentId: newStudentId,
      status: { $ne: 'deleted' },
    });

    if (duplicate) {
      const err = new Error(`Student with ID "${newStudentId}" already exists for this school`);
      err.statusCode = 409;
      throw err;
    }
  }

  // Check bus validity if updated
  if (busId !== undefined && busId !== null) {
    const busExists = await Bus.findOne({ _id: busId, schoolId, status: 'active' });
    if (!busExists) {
      const err = new Error('Assigned bus not found or deactivated');
      err.statusCode = 400;
      throw err;
    }
  }

  // Apply updates
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      student[key] = updateData[key];
    }
  });

  await student.save();
  return await Student.findById(student._id).populate('busId');
};

/**
 * Soft delete student
 */
const deleteStudent = async (schoolId, studentId) => {
  const student = await Student.findOne({ _id: studentId, schoolId, status: { $ne: 'deleted' } });
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  student.status = 'deleted';
  await student.save();

  return { message: 'Student deleted successfully' };
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
