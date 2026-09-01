const driverService = require('../services/driverService');

const create = async (req, res, next) => {
  try {
    const driver = await driverService.createDriver(req.school._id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const search = req.query.search || '';

    const result = await driverService.getDrivers(req.school._id, { page, limit, search });
    return res.status(200).json({
      success: true,
      message: 'Drivers fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const driver = await driverService.getDriverById(req.school._id, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Driver details fetched successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const driver = await driverService.updateDriver(req.school._id, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await driverService.deleteDriver(req.school._id, req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
};
