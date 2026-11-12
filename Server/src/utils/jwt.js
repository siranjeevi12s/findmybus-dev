const jwt = require('jsonwebtoken');

// Fail fast on misconfiguration: a guessable fallback secret would silently
// allow token forgery in any deployment that forgets to set the env vars.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in the environment');
}

const generateAccessToken = (schoolId) => {
  return jwt.sign({ schoolId }, JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (schoolId) => {
  return jwt.sign({ schoolId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
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
