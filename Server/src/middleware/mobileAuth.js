const jwt = require('jsonwebtoken');

// Fail fast on misconfiguration (see utils/mobileJwt.js for rationale).
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in the environment');
}

/**
 * Middleware that validates mobile JWT (payload: { userId, role })
 * Sets req.mobileUser = { userId, role } on success.
 */
function mobileProtect(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization header missing', data: {}, error: { field: 'authorization', reason: 'Missing or malformed' } });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Expect payload to contain userId and role
    if (!payload.userId || !payload.role) {
      throw new Error('Invalid token payload');
    }
    req.mobileUser = { userId: payload.userId, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', data: {}, error: { field: 'authorization', reason: err.message } });
  }
}

module.exports = { mobileProtect };
