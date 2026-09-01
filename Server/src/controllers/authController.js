const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const result = await authService.registerSchool(req.body);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { email: result.email },
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    return res.status(200).json({
      success: true,
      message: 'Email verified and school registered successfully',
      data: {
        school: result.school,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const result = await authService.resendOtp(req.body);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { email: result.email },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.loginSchool(req.body);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        school: result.school,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }
    const result = await authService.rotateToken(token);
    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }
    const result = await authService.logoutSchool(token);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.school is already populated by protect middleware
    return res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      data: { school: req.school },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  refreshToken,
  logout,
  getMe,
};
