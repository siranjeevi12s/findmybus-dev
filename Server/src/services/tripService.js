const Trip = require('../models/Trip');
const TripLocation = require('../models/TripLocation');
const BusDriverAssignment = require('../models/BusDriverAssignment');
const { getSocketManager } = require('../utils/socketManager');
const { debugLog } = require('../utils/log');

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
    const room = `bus:${trip.busId.toString()}`;
    io.to(room).emit('trip:started', {
      tripId: trip._id,
      busId: trip.busId,
      status: 'active',
      startedAt: trip.startedAt,
    });
    debugLog(`[SOCKET][BACKEND] emitted trip:started room=${room} tripId=${trip._id}`);
  } else {
    console.warn(`[SOCKET][BACKEND] trip:started NOT emitted (io unavailable) tripId=${trip._id}`);
  }

  // Populate references for the response
  await trip.populate('busId');
  await trip.populate('driverId');
  return trip;
};

const updateLocation = async (tripId, driverId, locationData) => {
  const { latitude, longitude, accuracy, speed, heading, timestamp } = locationData;

  const trip = await Trip.findOne({ _id: tripId, driverId, status: 'active' });
  if (!trip) {
    const err = new Error('Active trip not found');
    err.statusCode = 404;
    throw err;
  }

  // Out-of-order protection: if the driver reports a capture time older than
  // the stored position, ignore it so delayed/replayed payloads cannot drag
  // the bus backwards. (Client-side guards exist; the server must not trust
  // the client either.)
  const clientTs = Number.isFinite(Number(timestamp)) ? Number(timestamp) : null;
  if (clientTs !== null && trip.locationUpdatedAt) {
    const storedTs = new Date(trip.locationUpdatedAt).getTime();
    if (clientTs <= storedTs) {
      debugLog(
        `[GPS][BACKEND] ignored stale update tripId=${trip._id} clientTs=${clientTs} storedTs=${storedTs}`
      );
      return trip;
    }
  }

  const now = new Date(clientTs !== null && clientTs <= Date.now() + 60_000
    ? clientTs
    : Date.now());

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

  // Emit socket event. `updatedAt` matches the REST field name; `timestamp`
  // is kept for backward compatibility with older app builds.
  const io = getSocketManager();
  if (io) {
    const room = `bus:${trip.busId.toString()}`;
    io.to(room).emit('location:update', {
      tripId: trip._id,
      busId: trip.busId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      timestamp: now,
      updatedAt: now,
    });
    debugLog(
      `[GPS][BACKEND] broadcast room=${room} tripId=${trip._id} lat=${Number(latitude).toFixed(3)} lng=${Number(longitude).toFixed(3)}`
    );
  } else {
    console.warn(`[GPS][BACKEND] location NOT broadcast (io unavailable) tripId=${trip._id}`);
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
    const room = `bus:${trip.busId.toString()}`;
    io.to(room).emit('trip:ended', {
      tripId: trip._id,
      busId: trip.busId,
      status: trip.status,
      endedAt: trip.endedAt,
    });
    debugLog(`[SOCKET][BACKEND] emitted trip:ended room=${room} tripId=${trip._id}`);
  } else {
    console.warn(`[SOCKET][BACKEND] trip:ended NOT emitted (io unavailable) tripId=${trip._id}`);
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
