const assignmentService = require('../services/assignmentService');

const create = async (req, res, next) => {
  try {
    const assignment = await assignmentService.assignDriver(req.school._id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Bus and driver assigned successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const status = req.query.status || ''; // active or inactive

    const result = await assignmentService.getAssignments(req.school._id, { page, limit, status });
    return res.status(200).json({
      success: true,
      message: 'Assignments fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await assignmentService.unassign(req.school._id, req.params.id);
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
  remove,
};
