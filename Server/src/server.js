// Load environment variables first
require('dotenv').config();

const http = require('http');
const { Server: SocketServer } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { verifyMobileAccessToken } = require('./utils/mobileJwt');
const { initSocketManager } = require('./utils/socketManager');
const Student = require('./models/Student');

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
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
  console.log(`[SOCKET][BACKEND] connected role=${role} userId=${userId} socketId=${socket.id}`);
  
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
      console.log(`[SOCKET][BACKEND] parent joined room=bus:${busId} userId=${userId}`);
    } catch (err) {
      console.error(`[SOCKET][BACKEND] join-bus authorization error: ${err.message}`);
    }
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`[SOCKET][BACKEND] disconnected role=${role} userId=${userId} reason=${reason}`);
  });
});

initSocketManager(io);

// Connect to MongoDB
connectDB().then(() => {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
