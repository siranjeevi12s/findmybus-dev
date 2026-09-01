require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Register every model so Mongoose creates each collection and its declared indexes.
const models = [
  require('../models/School'),
  require('../models/Bus'),
  require('../models/Driver'),
  require('../models/Student'),
  require('../models/BusDriverAssignment'),
  require('../models/Trip'),
  require('../models/TripLocation'),
  require('../models/Otp'),
  require('../models/MobileOtp'),
  require('../models/RefreshToken'),
  require('../models/MobileSession'),
];

async function initializeDatabase() {
  const connection = await connectDB();

  try {
    await Promise.all(models.map((model) => model.init()));
    console.log(`Database initialized: ${connection.connection.name}`);
    console.log(`Collections and indexes ensured: ${models.length}`);
  } finally {
    await mongoose.disconnect();
  }
}

initializeDatabase().catch((error) => {
  console.error(`Database initialization failed: ${error.message}`);
  process.exit(1);
});
