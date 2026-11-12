// Load environment variables first
require('dotenv').config();

const http = require('http');
const { Server: SocketServer } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { verifyMobileAccessToken } = require('./utils/mobileJwt');
const { initSocketManager } = require('./utils/socketManager');
const { debugLog } = require('./utils/log');
const { corsOptions } = require('./config/cors');
const Student = require('./models/Student');

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

const io = new SocketServer(httpServer, {
  cors: corsOptions,
});

// Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.warn('[SOCKET][BACKEND] handshake rejected: missing token');
    return next(new Error('Authentication required'));
  }
  const decoded = verifyMobileAccessToken(token);
  if (!decoded) {
    console.warn('[SOCKET][BACKEND] handshake rejected: invalid/expired token');
    return next(new Error('Invalid token'));
  }
  socket.data.userId = decoded.userId;
  socket.data.role = decoded.role;
  next();
});

io.on('connection', (socket) => {
  const { userId, role } = socket.data;
  debugLog(`[SOCKET][BACKEND] connected role=${role} userId=${userId} socketId=${socket.id}`);
  
  if (role === 'driver') {
    socket.join(`driver:${userId}`);
  }
  
  socket.on('join-bus', async (busId) => {
    if (role !== 'parent' || !busId) return;
    // Authorization: a parent may only subscribe to the bus their own
    // student is assigned to. Never trust the client-provided busId.
    try {
      const student = await Student.findById(socket.data.userId).select('busId status');
      const allowed =
        student &&
        student.status === 'active' &&
        student.busId &&
        String(student.busId) === String(busId);
      if (!allowed) {
        console.warn(
          `[SOCKET][BACKEND] join-bus DENIED userId=${socket.data.userId} requested=${busId}`
        );
        return;
      }
      socket.join(`bus:${busId}`);
      debugLog(`[SOCKET][BACKEND] parent joined room=bus:${busId} userId=${userId}`);
    } catch (err) {
      console.error(`[SOCKET][BACKEND] join-bus authorization error: ${err.message}`);
    }
  });
  
  socket.on('disconnect', (reason) => {
    debugLog(`[SOCKET][BACKEND] disconnected role=${role} userId=${userId} reason=${reason}`);
  });
});

initSocketManager(io);

// Resilience: a transient MongoDB Atlas/network error must not take down the
// whole API + socket server. Log unhandled rejections (often a floating promise
// during a DB blip) instead of letting Node crash the process. An uncaught
// exception leaves state unknown, so log and exit cleanly for the supervisor
// (nodemon/systemd) to restart.
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL-GUARD] Unhandled promise rejection:', reason instanceof Error ? reason.message : reason);
});
process.on('uncaughtException', (err) => {
  console.error('[FATAL-GUARD] Uncaught exception:', err && err.stack ? err.stack : err);
  httpServer.close(() => process.exit(1));
  // Force-exit if connections do not drain promptly.
  setTimeout(() => process.exit(1), 5000).unref();
});

// Connect to MongoDB
connectDB().then(() => {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
