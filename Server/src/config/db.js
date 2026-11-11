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

    // Attach listeners so post-connect transient errors (e.g. an Atlas TLS
    // blip) are logged rather than emitted as an unhandled 'error' event that
    // crashes the process. The driver auto-reconnects on its own.
    conn.connection.on('error', (e) => {
      console.error('[DB] connection error:', e && e.message ? e.message : e);
    });
    conn.connection.on('disconnected', () => {
      console.warn('[DB] disconnected — driver will attempt to reconnect');
    });
    conn.connection.on('reconnected', () => {
      console.log('[DB] reconnected');
    });

    return conn;
  } catch (error) {
    throw new Error(`Database connection error: ${error.message}`);
  }
};

module.exports = connectDB;
