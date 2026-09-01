const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createStudentSchema = z.object({
  studentName: z.string().min(1, 'Student name is required').trim(),
  studentId: z.string().min(1, 'Student ID is required').trim(),
  grade: z.string().min(1, 'Class/Grade is required').trim(),
  section: z.string().min(1, 'Section is required').trim(),
  parentName: z.string().min(1, 'Parent name is required').trim(),
  parentEmail: z.string().email('Invalid parent email address').toLowerCase().trim(),
  parentPhone: z.string().min(8, 'Parent phone number must be at least 8 digits').trim(),
  busId: z.string().regex(objectIdRegex, 'Invalid Bus ID').nullable().optional(),
});

const updateStudentSchema = z.object({
  studentName: z.string().min(1, 'Student name is required').trim().optional(),
  studentId: z.string().min(1, 'Student ID is required').trim().optional(),
  grade: z.string().min(1, 'Class/Grade is required').trim().optional(),
  section: z.string().min(1, 'Section is required').trim().optional(),
  parentName: z.string().min(1, 'Parent name is required').trim().optional(),
  parentEmail: z.string().email('Invalid parent email address').toLowerCase().trim().optional(),
  parentPhone: z.string().min(8, 'Parent phone number must be at least 8 digits').trim().optional(),
  busId: z.string().regex(objectIdRegex, 'Invalid Bus ID').nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

module.exports = {
  createStudentSchema,
  updateStudentSchema,
};
