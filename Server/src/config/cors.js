const DEFAULT_PRODUCTION_ORIGINS = [
  'https://find-my-school-bus.netlify.app',
  'https://regester12s.netlify.app',
  'https://success12s.netlify.app',
];

const parseOrigins = (value) =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const configuredOrigins = parseOrigins(
  process.env.CLIENT_URL || process.env.CORS_ORIGINS,
);

const isValidOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const validProtocol =
      process.env.NODE_ENV === 'production'
        ? url.protocol === 'https:'
        : url.protocol === 'http:' || url.protocol === 'https:';
    return validProtocol && url.origin === origin;
  } catch {
    return false;
  }
};

const allowedOrigins = [
  ...new Set([
    ...DEFAULT_PRODUCTION_ORIGINS,
    ...configuredOrigins.filter(
      (origin) => origin !== '*' && isValidOrigin(origin),
    ),
  ]),
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return allowedOrigins.includes(origin);
};

const corsOrigin = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    return callback(null, true);
  }
  return callback(new Error('Not allowed by CORS'), false);
};

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

module.exports = {
  allowedOrigins,
  corsOptions,
  corsOrigin,
};
