const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createAssignmentSchema = z.object({
  busId: z.string().regex(objectIdRegex, 'Invalid Bus ID'),
  driverId: z.string().regex(objectIdRegex, 'Invalid Driver ID'),
});

module.exports = {
  createAssignmentSchema,
};
