const busService = require('../services/busService');

const create = async (req, res, next) => {
  try {
    const bus = await busService.createBus(req.school._id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      data: bus,
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

    const result = await busService.getBuses(req.school._id, { page, limit, search });
    return res.status(200).json({
      success: true,
      message: 'Buses fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const bus = await busService.getBusById(req.school._id, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Bus details fetched successfully',
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const bus = await busService.updateBus(req.school._id, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Bus updated successfully',
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await busService.deleteBus(req.school._id, req.params.id);
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
