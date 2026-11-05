const { z } = require('zod');

// Payload sent by the (unauthenticated) parent registration screen
// and by register-student.html. School and Bus are find-or-created
// server-side from schoolName/schoolEmail/busNumber.
const registerStudentSchema = z.object({
  studentName: z.string().min(1, 'Student name is required').trim(),
  studentId: z.string().min(1, 'Student ID is required').trim(),
  grade: z.string().min(1, 'Class/Grade is required').trim(),
  section: z.string().min(1, 'Section is required').trim(),
  parentName: z.string().min(1, 'Parent name is required').trim(),
  parentEmail: z.string().email('Invalid parent email address').toLowerCase().trim(),
  parentPhone: z.string().min(8, 'Parent phone number must be at least 8 digits').trim(),
  busNumber: z.string().min(1, 'Bus number is required').trim(),
  schoolName: z.string().min(1, 'School name is required').trim(),
  schoolEmail: z.string().email('Invalid school email address').toLowerCase().trim(),
});

module.exports = { registerStudentSchema };
