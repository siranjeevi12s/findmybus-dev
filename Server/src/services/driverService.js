const Driver = require('../models/Driver');
const BusDriverAssignment = require('../models/BusDriverAssignment');

/**
 * Create a new driver
 */
const createDriver = async (schoolId, driverData) => {
  const { licenseNumber } = driverData;

  // Check if license number already exists for this school
  const duplicate = await Driver.findOne({
    schoolId,
    licenseNumber,
    status: { $ne: 'deleted' },
  });

  if (duplicate) {
    const err = new Error(`Driver with license number "${licenseNumber}" already exists for this school`);
    err.statusCode = 409;
    throw err;
  }

  const driver = new Driver({
    ...driverData,
    schoolId,
  });

  return await driver.save();
};

/**
 * Get all drivers (paginated + searchable)
 */
const getDrivers = async (schoolId, { page = 1, limit = 10, search = '' }) => {
  const query = {
    schoolId,
    status: { $ne: 'deleted' },
  };

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
      { licenseNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const total = await Driver.countDocuments(query);
  const drivers = await Driver.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    drivers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single driver details
 */
const getDriverById = async (schoolId, driverId) => {
  const driver = await Driver.findOne({ _id: driverId, schoolId, status: { $ne: 'deleted' } }).lean();
  if (!driver) {
    const err = new Error('Driver not found');
    err.statusCode = 404;
    throw err;
  }
  return driver;
};

/**
 * Update driver details
 */
const updateDriver = async (schoolId, driverId, updateData) => {
  const driver = await Driver.findOne({ _id: driverId, schoolId, status: { $ne: 'deleted' } });
  if (!driver) {
    const err = new Error('Driver not found');
    err.statusCode = 404;
    throw err;
  }

  const { licenseNumber } = updateData;

  // Check for license duplicate if updated
  if (licenseNumber && licenseNumber !== driver.licenseNumber) {
    const duplicate = await Driver.findOne({
      schoolId,
      licenseNumber,
      status: { $ne: 'deleted' },
    });

    if (duplicate) {
      const err = new Error(`Driver with license number "${licenseNumber}" already exists for this school`);
      err.statusCode = 409;
      throw err;
    }
  }

  // Apply updates
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      driver[key] = updateData[key];
    }
  });

  return await driver.save();
};

/**
 * Soft delete driver
 */
const deleteDriver = async (schoolId, driverId) => {
  const driver = await Driver.findOne({ _id: driverId, schoolId, status: { $ne: 'deleted' } });
  if (!driver) {
    const err = new Error('Driver not found');
    err.statusCode = 404;
    throw err;
  }

  // Soft delete driver
  driver.status = 'deleted';
  await driver.save();

  // Invalidate any active driver assignments for this driver
  await BusDriverAssignment.updateMany(
    { schoolId, driverId, status: 'active' },
    { status: 'inactive', unassignedAt: new Date() }
  );

  return { message: 'Driver deleted successfully' };
};

module.exports = {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
};
