const { z } = require('zod');

const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  // Capture time used by the server's out-of-order guard. Accept number or
  // numeric string (the service coerces with Number()); keep it in the schema
  // so body sanitization does not strip it.
  timestamp: z.union([z.number(), z.string()]).optional(),
});

module.exports = { locationUpdateSchema };
