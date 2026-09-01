const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const busRoutes = require('./routes/busRoutes');
const driverRoutes = require('./routes/driverRoutes');
const studentRoutes = require('./routes/studentRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const mobileAuthRoutes = require('./routes/mobileAuthRoutes');
const mobileDriverRoutes = require('./routes/mobileDriverRoutes');
const mobileParentRoutes = require('./routes/mobileParentRoutes');
const app = express();

// Middleware setup
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint (Required by rules)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/bus-driver-assignments', assignmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mobile/auth', mobileAuthRoutes);
app.use('/api/mobile/driver', mobileDriverRoutes);
app.use('/api/mobile/parent', mobileParentRoutes);

// 404 Route handler
app.use((req, res, next) => {
  const err = new Error('API route not found');
  err.statusCode = 404;
  next(err);
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
