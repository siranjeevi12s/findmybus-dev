const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_find_my_bus_app';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_for_find_my_bus_app';

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
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const verifyMobileRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
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
