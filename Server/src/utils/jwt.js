const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_find_my_bus_app';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_for_find_my_bus_app';

const generateAccessToken = (schoolId) => {
  return jwt.sign({ schoolId }, JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (schoolId) => {
  return jwt.sign({ schoolId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
