const express = require('express');
const router = express.Router();

const assignmentController = require('../controllers/assignmentController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createAssignmentSchema } = require('../validators/assignmentValidator');

// Apply protection middleware to all assignment routes
router.use(protect);

router.route('/')
  .get(assignmentController.getAll)
  .post(validate(createAssignmentSchema), assignmentController.create);

router.route('/:id')
  .delete(assignmentController.remove);

module.exports = router;
