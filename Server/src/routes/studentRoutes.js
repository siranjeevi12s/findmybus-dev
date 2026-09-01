const express = require('express');
const router = express.Router();

const studentController = require('../controllers/studentController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createStudentSchema, updateStudentSchema } = require('../validators/studentValidator');

// Apply protection middleware to all student routes
router.use(protect);

router.route('/')
  .get(studentController.getAll)
  .post(validate(createStudentSchema), studentController.create);

router.route('/:id')
  .get(studentController.getById)
  .put(validate(updateStudentSchema), studentController.update)
  .delete(studentController.remove);

module.exports = router;
