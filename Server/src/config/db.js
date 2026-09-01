const mongoose = require('mongoose');

const connectDB = async () => {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error('DB_URL is not configured');
  }

  try {
    const conn = await mongoose.connect(dbUrl, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.name} on ${conn.connection.host}`);
    return conn;
  } catch (error) {
    throw new Error(`Database connection error: ${error.message}`);
  }
};

module.exports = connectDB;
