const jwt = require('jsonwebtoken');

// Fail fast on misconfiguration: a guessable fallback secret would silently
// allow token forgery in any deployment that forgets to set the env vars.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in the environment');
}

/**
 * Generate short-lived access token for mobile users (drivers/parents).
 * Payload: { userId, role }
 */
const generateMobileAccessToken = (userId, role) => {
  return jwt.sign({ userId: userId.toString(), role }, JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Generate long-lived refresh token for mobile users.
 * Payload: { userId, role }
 */
const generateMobileRefreshToken = (userId, role) => {
  return jwt.sign({ userId: userId.toString(), role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const verifyMobileAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
};

const verifyMobileRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
};

module.exports = {
  generateMobileAccessToken,
  generateMobileRefreshToken,
  verifyMobileAccessToken,
  verifyMobileRefreshToken,
};
