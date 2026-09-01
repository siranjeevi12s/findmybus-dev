const parentService = require('../services/parentService');

const getProfile = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await parentService.getParentProfile(userId);
    return res.status(200).json({
      success: true,
      message: 'Profile fetched',
      data: profile,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const getStudent = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await parentService.getParentProfile(userId);
    return res.status(200).json({
      success: true,
      message: 'Student fetched',
      data: profile.student,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const getBus = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await parentService.getParentProfile(userId);
    return res.status(200).json({
      success: true,
      message: 'Bus fetched',
      data: profile.bus,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const getActiveTrip = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await parentService.getParentProfile(userId);
    const busId = profile.bus ? profile.bus._id : null;
    const trip = await parentService.getActiveTrip(busId);
    return res.status(200).json({
      success: true,
      message: 'Active trip fetched',
      data: trip,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const getBusLocation = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await parentService.getParentProfile(userId);
    const busId = profile.bus ? profile.bus._id : null;
    const location = await parentService.getBusLocation(busId);
    return res.status(200).json({
      success: true,
      message: 'Bus location fetched',
      data: location,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getStudent,
  getBus,
  getActiveTrip,
  getBusLocation,
};
