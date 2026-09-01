const express = require('express');
const router = express.Router();

const driverController = require('../controllers/driverController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createDriverSchema, updateDriverSchema } = require('../validators/driverValidator');

// Apply protection middleware to all driver routes
router.use(protect);

router.route('/')
  .get(driverController.getAll)
  .post(validate(createDriverSchema), driverController.create);

router.route('/:id')
  .get(driverController.getById)
  .put(validate(updateDriverSchema), driverController.update)
  .delete(driverController.remove);

module.exports = router;
