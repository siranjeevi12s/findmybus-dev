const mobileAuthService = require('../services/mobileAuthService');

const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await mobileAuthService.sendOtp(email);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { email: result.email, role: result.role },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await mobileAuthService.verifyOtp(email, otp);
    return res.status(200).json({
      success: true,
      message: 'Verified successfully',
      data: result,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await mobileAuthService.resendOtp(email);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { email: result.email },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await mobileAuthService.refreshMobileToken(token);
    return res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: result,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await mobileAuthService.logoutMobile(token);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: {},
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { userId, role } = req.mobileUser;
    const result = await mobileAuthService.getMobileMe(userId, role);
    return res.status(200).json({
      success: true,
      message: 'Profile fetched',
      data: result,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
  refreshToken,
  logout,
  getMe,
};
