const dashboardService = require('../services/dashboardService');

const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats(req.school._id);
    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics fetched successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
};
