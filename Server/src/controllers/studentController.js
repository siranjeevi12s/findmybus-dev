const studentService = require('../services/studentService');

const create = async (req, res, next) => {
  try {
    const student = await studentService.createStudent(req.school._id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student,
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

    const result = await studentService.getStudents(req.school._id, { page, limit, search });
    return res.status(200).json({
      success: true,
      message: 'Students fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(req.school._id, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Student details fetched successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const student = await studentService.updateStudent(req.school._id, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await studentService.deleteStudent(req.school._id, req.params.id);
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
