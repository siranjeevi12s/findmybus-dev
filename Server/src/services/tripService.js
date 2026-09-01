const Trip = require('../models/Trip');
const TripLocation = require('../models/TripLocation');
const BusDriverAssignment = require('../models/BusDriverAssignment');
const { getSocketManager } = require('../utils/socketManager');

const startTrip = async (driverId) => {
  const assignment = await BusDriverAssignment.findOne({ driverId, status: 'active' })
    .populate('busId')
    .populate('schoolId');

  if (!assignment) {
    const err = new Error('No active bus assignment found');
    err.statusCode = 400;
    throw err;
  }

  const existingTrip = await Trip.findOne({ driverId, status: 'active' });
  if (existingTrip) {
    const err = new Error('A trip is already in progress');
    err.statusCode = 409;
    throw err;
  }

  const trip = await Trip.create({
    schoolId: assignment.schoolId._id,
    busId: assignment.busId._id,
    driverId,
    status: 'active',
    startedAt: new Date(),
  });

  const io = getSocketManager();
  if (io) {
    io.to(`bus:${trip.busId.toString()}`).emit('trip:started', {
      tripId: trip._id,
      busId: trip.busId,
    });
  }

  // Populate references for the response
  await trip.populate('busId');
  await trip.populate('driverId');
  return trip;
};

const updateLocation = async (tripId, driverId, locationData) => {
  const { latitude, longitude, accuracy, speed, heading } = locationData;

  const trip = await Trip.findOne({ _id: tripId, driverId, status: 'active' });
  if (!trip) {
    const err = new Error('Active trip not found');
    err.statusCode = 404;
    throw err;
  }

  const now = new Date();

  // Update trip current location
  trip.currentLatitude = latitude;
  trip.currentLongitude = longitude;
  trip.currentAccuracy = accuracy;
  trip.currentSpeed = speed;
  trip.currentHeading = heading;
  trip.locationUpdatedAt = now;
  await trip.save();

  // Save breadcrumb
  await TripLocation.create({
    tripId,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    timestamp: now,
  });

  // Emit socket event
  const io = getSocketManager();
  if (io) {
    io.to(`bus:${trip.busId.toString()}`).emit('location:update', {
      tripId: trip._id,
      busId: trip.busId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      timestamp: now,
    });
  }

  return trip;
};

const stopTrip = async (tripId, driverId) => {
  const trip = await Trip.findOne({ _id: tripId, driverId, status: 'active' });
  if (!trip) {
    const err = new Error('Active trip not found');
    err.statusCode = 404;
    throw err;
  }

  trip.status = 'completed';
  trip.endedAt = new Date();
  await trip.save();

  const io = getSocketManager();
  if (io) {
    io.to(`bus:${trip.busId.toString()}`).emit('trip:ended', {
      tripId: trip._id,
      busId: trip.busId,
    });
  }

  return trip;
};

const getCurrentTrip = async (driverId) => {
  return await Trip.findOne({ driverId, status: 'active' }).populate('busId');
};

const getActiveTripForBus = async (busId) => {
  return await Trip.findOne({ busId, status: 'active' }).populate('driverId');
};

module.exports = {
  startTrip,
  updateLocation,
  stopTrip,
  getCurrentTrip,
  getActiveTripForBus,
};
