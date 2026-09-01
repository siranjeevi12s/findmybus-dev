const { z } = require('zod');

const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required').trim(),
  phone: z.string().min(1, 'Emergency contact phone number is required').trim(),
});

const createDriverSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 digits').trim(),
  email: z.string().email('Invalid driver email address').toLowerCase().trim(),
  licenseNumber: z.string().min(1, 'License number is required').trim(),
  licenseExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid license expiry date',
  }),
  address: z.string().min(1, 'Address is required').trim(),
  emergencyContact: emergencyContactSchema,
});

const updateDriverSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim().optional(),
  lastName: z.string().min(1, 'Last name is required').trim().optional(),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 digits').trim().optional(),
  email: z.string().email('Invalid driver email address').toLowerCase().trim().optional(),
  licenseNumber: z.string().min(1, 'License number is required').trim().optional(),
  licenseExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid license expiry date',
  }).optional(),
  address: z.string().min(1, 'Address is required').trim().optional(),
  emergencyContact: emergencyContactSchema.optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

module.exports = {
  createDriverSchema,
  updateDriverSchema,
};
