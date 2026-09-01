const express = require('express');
const router = express.Router();

const busController = require('../controllers/busController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createBusSchema, updateBusSchema } = require('../validators/busValidator');

// Apply protection middleware to all bus routes
router.use(protect);

router.route('/')
  .get(busController.getAll)
  .post(validate(createBusSchema), busController.create);

router.route('/:id')
  .get(busController.getById)
  .put(validate(updateBusSchema), busController.update)
  .delete(busController.remove);

module.exports = router;
