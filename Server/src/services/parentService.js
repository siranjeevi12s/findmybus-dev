const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const School = require('../models/School');
const Bus = require('../models/Bus');
const Student = require('../models/Student');
const BusDriverAssignment = require('../models/BusDriverAssignment');
const Trip = require('../models/Trip');
const TripLocation = require('../models/TripLocation');

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

/**
 * Public student registration (used by the mobile app's register-student
 * screen and register-student.html). Parents have no account yet, so this
 * creates the full chain: School (find-or-create by email) -> Bus
 * (find-or-create by busNumber) -> Student.
 */
const registerStudent = async (payload) => {
  const {
    studentName, studentId, grade, section,
    parentName, parentEmail, parentPhone,
    busNumber, schoolName, schoolEmail,
  } = payload;

  const normEmail = String(parentEmail).toLowerCase().trim();
  const normSchoolEmail = String(schoolEmail).toLowerCase().trim();

  // Prevent duplicate parent accounts — mobile login resolves users by parentEmail
  const existingStudent = await Student.findOne({ parentEmail: normEmail, status: { $ne: 'deleted' } });
  if (existingStudent) {
    const err = new Error('This parent email is already registered. Please login instead.');
    err.statusCode = 409;
    throw err;
  }

  // 1. Find or create the school
  let school = await School.findOne({ email: normSchoolEmail, status: { $ne: 'deleted' } });
  if (!school) {
    // Random, unknown password — school admin can reset it later
    const randomHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
    school = await School.create({
      name: schoolName,
      email: normSchoolEmail,
      passwordHash: randomHash,
    });
  }

  // 2. Find or create the bus within this school
  let bus = await Bus.findOne({ schoolId: school._id, busNumber, status: { $ne: 'deleted' } });
  if (!bus) {
    bus = await Bus.create({
      schoolId: school._id,
      busNumber,
      registrationNumber: `REG-${busNumber}`,
      capacity: 40,
    });
  }

  // 3. Create the student
  const student = await Student.create({
    schoolId: school._id,
    studentName,
    studentId,
    grade,
    section,
    parentName,
    parentEmail: normEmail,
    parentPhone,
    busId: bus._id,
  });

  return {
    _id: student._id,
    studentName: student.studentName,
    studentId: student.studentId,
    parentEmail: student.parentEmail,
    busNumber: bus.busNumber,
    schoolName: school.name,
  };
};

/**
 * Breadcrumb trail for the ACTIVE trip of a bus, oldest-first. Lets a parent
 * who opens the app mid-trip render the route travelled so far instead of
 * waiting for live socket events. busId must be derived server-side from the
 * authenticated parent's student — never taken from the client.
 */
const getActiveTripPath = async (busId, limit = 500) => {
  if (!busId) return [];
  const trip = await Trip.findOne({ busId, status: 'active' }).select('_id');
  if (!trip) return [];

  const points = await TripLocation.find({ tripId: trip._id })
    .sort({ timestamp: 1 })
    .limit(limit)
    .select('latitude longitude accuracy speed heading timestamp')
    .lean();

  return points.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
    accuracy: p.accuracy,
    speed: p.speed,
    heading: p.heading,
    timestamp: p.timestamp ? new Date(p.timestamp).getTime() : null,
  }));
};

module.exports = {
  getParentProfile,
  getActiveTrip,
  getBusLocation,
  getActiveTripPath,
  registerStudent,
};
