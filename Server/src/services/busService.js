const Bus = require('../models/Bus');
const BusDriverAssignment = require('../models/BusDriverAssignment');
const Student = require('../models/Student');

/**
 * Create a new bus
 */
const createBus = async (schoolId, busData) => {
  const { busNumber, registrationNumber } = busData;

  // Check if bus number or registration number already exists (not deleted) for this school
  const duplicate = await Bus.findOne({
    schoolId,
    $or: [{ busNumber }, { registrationNumber }],
    status: { $ne: 'deleted' },
  });

  if (duplicate) {
    const field = duplicate.busNumber === busNumber ? 'busNumber' : 'registrationNumber';
    const val = duplicate.busNumber === busNumber ? busNumber : registrationNumber;
    const err = new Error(`Bus with ${field} "${val}" already exists for this school`);
    err.statusCode = 409;
    throw err;
  }

  const bus = new Bus({
    ...busData,
    schoolId,
  });

  return await bus.save();
};

/**
 * Get all buses (paginated + searchable)
 */
const getBuses = async (schoolId, { page = 1, limit = 10, search = '' }) => {
  const query = {
    schoolId,
    status: { $ne: 'deleted' },
  };

  if (search) {
    query.$or = [
      { busNumber: { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const total = await Bus.countDocuments(query);
  const buses = await Bus.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    buses,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single bus details
 */
const getBusById = async (schoolId, busId) => {
  const bus = await Bus.findOne({ _id: busId, schoolId, status: { $ne: 'deleted' } }).lean();
  if (!bus) {
    const err = new Error('Bus not found');
    err.statusCode = 404;
    throw err;
  }
  return bus;
};

/**
 * Update bus details
 */
const updateBus = async (schoolId, busId, updateData) => {
  const bus = await Bus.findOne({ _id: busId, schoolId, status: { $ne: 'deleted' } });
  if (!bus) {
    const err = new Error('Bus not found');
    err.statusCode = 404;
    throw err;
  }

  const { busNumber, registrationNumber } = updateData;

  // Check for duplicates if identifying numbers are changed
  if (busNumber || registrationNumber) {
    const duplicate = await Bus.findOne({
      schoolId,
      _id: { $ne: busId },
      $or: [
        busNumber ? { busNumber } : null,
        registrationNumber ? { registrationNumber } : null,
      ].filter(Boolean),
      status: { $ne: 'deleted' },
    });

    if (duplicate) {
      const field = duplicate.busNumber === busNumber ? 'busNumber' : 'registrationNumber';
      const val = duplicate.busNumber === busNumber ? busNumber : registrationNumber;
      const err = new Error(`Bus with ${field} "${val}" already exists for this school`);
      err.statusCode = 409;
      throw err;
    }
  }

  // Apply updates
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      bus[key] = updateData[key];
    }
  });

  return await bus.save();
};

/**
 * Soft delete bus
 */
const deleteBus = async (schoolId, busId) => {
  const bus = await Bus.findOne({ _id: busId, schoolId, status: { $ne: 'deleted' } });
  if (!bus) {
    const err = new Error('Bus not found');
    err.statusCode = 404;
    throw err;
  }

  // Mark status as deleted
  bus.status = 'deleted';
  await bus.save();

  // Invalidate any active driver assignments for this bus
  await BusDriverAssignment.updateMany(
    { schoolId, busId, status: 'active' },
    { status: 'inactive', unassignedAt: new Date() }
  );

  // Remove bus association from students
  await Student.updateMany(
    { schoolId, busId },
    { busId: null }
  );

  return { message: 'Bus deleted successfully' };
};

module.exports = {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
};
