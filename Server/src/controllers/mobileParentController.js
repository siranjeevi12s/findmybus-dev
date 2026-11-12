const parentService = require('../services/parentService');
const { createTTLCache } = require('../utils/cache');

// 60s TTL: parent profile changes infrequently during a session. Caching here
// benefits getProfile, getStudent, getBus, getActiveTrip, getBusLocation and
// getTripPath, all of which resolve the profile from the authenticated token.
const parentProfileCache = createTTLCache({ ttlMs: 60_000 });

async function getCachedParentProfile(userId) {
  const cached = parentProfileCache.get(userId);
  if (cached !== undefined) return cached;
  const profile = await parentService.getParentProfile(userId);
  parentProfileCache.set(userId, profile);
  return profile;
}

// Public endpoint (no auth): parent registers a student from the mobile app
// or register-student.html before they can login via OTP.
const registerStudent = async (req, res, next) => {
  try {
    const student = await parentService.registerStudent(req.body);
    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: student,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await getCachedParentProfile(userId);
    return res.status(200).json({
      success: true,
      message: 'Profile fetched',
      data: profile,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const getStudent = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await getCachedParentProfile(userId);
    return res.status(200).json({
      success: true,
      message: 'Student fetched',
      data: profile.student,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const getBus = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await getCachedParentProfile(userId);
    return res.status(200).json({
      success: true,
      message: 'Bus fetched',
      data: profile.bus,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveTrip = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await getCachedParentProfile(userId);
    const busId = profile.bus ? profile.bus._id : null;
    const trip = await parentService.getActiveTrip(busId);
    return res.status(200).json({
      success: true,
      message: 'Active trip fetched',
      data: trip,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const getBusLocation = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await getCachedParentProfile(userId);
    const busId = profile.bus ? profile.bus._id : null;
    const location = await parentService.getBusLocation(busId);
    return res.status(200).json({
      success: true,
      message: 'Bus location fetched',
      data: location,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Breadcrumb trail of the parent's own bus's active trip. The busId is
// resolved from the authenticated token, so one parent can never read
// another trip's route.
const getTripPath = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const profile = await getCachedParentProfile(userId);
    const busId = profile.bus ? profile.bus._id : null;
    const path = await parentService.getActiveTripPath(busId);
    return res.status(200).json({
      success: true,
      message: 'Trip path fetched',
      data: path,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerStudent,
  getProfile,
  getStudent,
  getBus,
  getActiveTrip,
  getBusLocation,
  getTripPath,
};
