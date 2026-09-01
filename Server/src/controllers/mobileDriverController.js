const tripService = require('../services/tripService');
const Driver = require('../models/Driver');
const BusDriverAssignment = require('../models/BusDriverAssignment');

const getProfile = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const driver = await Driver.findById(userId).populate('schoolId');
    if (!driver) {
      const err = new Error('Driver not found');
      err.statusCode = 404;
      throw err;
    }
    return res.status(200).json({
      success: true,
      message: 'Profile fetched',
      data: driver,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const getAssignment = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const assignment = await BusDriverAssignment.findOne({ driverId: userId, status: 'active' }).populate('busId');
    return res.status(200).json({
      success: true,
      message: 'Assignment fetched',
      data: assignment,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentTrip = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const trip = await tripService.getCurrentTrip(userId);
    return res.status(200).json({
      success: true,
      message: 'Current trip fetched',
      data: trip,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const startTrip = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const trip = await tripService.startTrip(userId);
    return res.status(201).json({
      success: true,
      message: 'Trip started',
      data: trip,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const { tripId } = req.params;
    const trip = await tripService.updateLocation(tripId, userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Location updated',
      data: trip,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const stopTrip = async (req, res, next) => {
  try {
    const { userId } = req.mobileUser;
    const { tripId } = req.params;
    const trip = await tripService.stopTrip(tripId, userId);
    return res.status(200).json({
      success: true,
      message: 'Trip stopped',
      data: trip,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getAssignment,
  getCurrentTrip,
  startTrip,
  updateLocation,
  stopTrip,
};
