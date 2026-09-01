const { z } = require('zod');

const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
});

module.exports = { locationUpdateSchema };
