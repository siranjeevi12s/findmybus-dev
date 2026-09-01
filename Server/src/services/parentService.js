const Student = require('../models/Student');
const BusDriverAssignment = require('../models/BusDriverAssignment');
const Trip = require('../models/Trip');

const getParentProfile = async (studentId) => {
  const student = await Student.findById(studentId).populate('schoolId').populate('busId');
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  let driver = null;
  if (student.busId) {
    const assignment = await BusDriverAssignment.findOne({ busId: student.busId._id, status: 'active' }).populate('driverId');
    if (assignment) {
      driver = assignment.driverId;
    }
  }

  return {
    student,
    bus: student.busId,
    driver,
    school: student.schoolId
  };
};

const getActiveTrip = async (busId) => {
  if (!busId) return null;
  return await Trip.findOne({ busId, status: 'active' }).populate('driverId', 'firstName lastName phoneNumber');
};

const getBusLocation = async (busId) => {
  if (!busId) return { active: false };
  const trip = await Trip.findOne({ busId, status: 'active' });
  if (!trip) {
    return { active: false };
  }
  
  return {
    active: true,
    tripId: trip._id,
    latitude: trip.currentLatitude,
    longitude: trip.currentLongitude,
    accuracy: trip.currentAccuracy,
    speed: trip.currentSpeed,
    heading: trip.currentHeading,
    updatedAt: trip.locationUpdatedAt,
  };
};

module.exports = {
  getParentProfile,
  getActiveTrip,
  getBusLocation,
};
