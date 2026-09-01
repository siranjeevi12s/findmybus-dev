const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Student = require('../models/Student');

/**
 * Get aggregated statistics for the dashboard
 */
const getStats = async (schoolId) => {
  const [totalBuses, totalDrivers, totalStudents, assignedStudents] = await Promise.all([
    Bus.countDocuments({ schoolId, status: { $ne: 'deleted' } }),
    Driver.countDocuments({ schoolId, status: { $ne: 'deleted' } }),
    Student.countDocuments({ schoolId, status: { $ne: 'deleted' } }),
    Student.countDocuments({ schoolId, status: { $ne: 'deleted' }, busId: { $ne: null } }),
  ]);

  return {
    totalBuses,
    totalDrivers,
    totalStudents,
    assignedStudents,
  };
};

module.exports = {
  getStats,
};
