const { z } = require('zod');

const createBusSchema = z.object({
  busNumber: z.string().min(1, 'Bus number is required').trim(),
  registrationNumber: z.string().min(1, 'Registration number is required').trim(),
  busType: z.enum(['Standard', 'Minibus', 'Coach']).default('Standard'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
});

const updateBusSchema = z.object({
  busNumber: z.string().min(1, 'Bus number is required').trim().optional(),
  registrationNumber: z.string().min(1, 'Registration number is required').trim().optional(),
  busType: z.enum(['Standard', 'Minibus', 'Coach']).optional(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

module.exports = {
  createBusSchema,
  updateBusSchema,
};
