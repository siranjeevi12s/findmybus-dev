const { verifyAccessToken } = require('../utils/jwt');
const School = require('../models/School');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token has expired or is invalid',
    });
  }

  try {
    const school = await School.findOne({ _id: decoded.schoolId, status: 'active' });
    if (!school) {
      return res.status(401).json({
        success: false,
        message: 'School account not found or is deactivated',
      });
    }

    if (!school.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required',
      });
    }

    req.school = school;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

module.exports = {
  protect,
};
