const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const BusDriverAssignment = require('../models/BusDriverAssignment');

/**
 * Assign a driver to a bus (deactivates previous pairings for this bus/driver)
 */
const assignDriver = async (schoolId, { busId, driverId }) => {
  // 1. Verify bus exists and belongs to this school
  const bus = await Bus.findOne({ _id: busId, schoolId, status: 'active' });
  if (!bus) {
    const err = new Error('Active bus not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Verify driver exists and belongs to this school
  const driver = await Driver.findOne({ _id: driverId, schoolId, status: 'active' });
  if (!driver) {
    const err = new Error('Active driver not found');
    err.statusCode = 404;
    throw err;
  }

  const now = new Date();

  // 3. Deactivate any active assignment for this bus
  await BusDriverAssignment.updateMany(
    { schoolId, busId, status: 'active' },
    { status: 'inactive', unassignedAt: now }
  );

  // 4. Deactivate any active assignment for this driver
  await BusDriverAssignment.updateMany(
    { schoolId, driverId, status: 'active' },
    { status: 'inactive', unassignedAt: now }
  );

  // 5. Create new active assignment
  const newAssignment = new BusDriverAssignment({
    schoolId,
    busId,
    driverId,
    status: 'active',
    assignedAt: now,
  });

  await newAssignment.save();

  // Populate the returned assignment for convenience
  return await BusDriverAssignment.findById(newAssignment._id)
    .populate('busId', 'busNumber registrationNumber busType capacity')
    .populate('driverId', 'firstName lastName phoneNumber email licenseNumber');
};

/**
 * Get all assignments for a school (populated)
 */
const getAssignments = async (schoolId, { page = 1, limit = 10, status = '' }) => {
  const query = { schoolId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const total = await BusDriverAssignment.countDocuments(query);
  const assignments = await BusDriverAssignment.find(query)
    .sort({ status: 1, createdAt: -1 }) // active first, then newest
    .skip(skip)
    .limit(limit)
    .populate('busId')
    .populate('driverId')
    .lean();

  return {
    assignments,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Terminate/Unassign an active pairing
 */
const unassign = async (schoolId, assignmentId) => {
  const assignment = await BusDriverAssignment.findOne({
    _id: assignmentId,
    schoolId,
    status: 'active',
  });

  if (!assignment) {
    const err = new Error('Active assignment not found');
    err.statusCode = 404;
    throw err;
  }

  assignment.status = 'inactive';
  assignment.unassignedAt = new Date();
  await assignment.save();

  return { message: 'Driver and bus unassigned successfully' };
};

module.exports = {
  assignDriver,
  getAssignments,
  unassign,
};
