// Load environment variables first
require('dotenv').config();

const http = require('http');
const { Server: SocketServer } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { verifyMobileAccessToken } = require('./utils/mobileJwt');
const { initSocketManager } = require('./utils/socketManager');

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
  if (!token) return next(new Error('Authentication required'));
  const decoded = verifyMobileAccessToken(token);
  if (!decoded) return next(new Error('Invalid token'));
  socket.data.userId = decoded.userId;
  socket.data.role = decoded.role;
  next();
});

io.on('connection', (socket) => {
  const { userId, role } = socket.data;
  console.log(`[Socket] Connected: ${role} ${userId}`);
  
  if (role === 'driver') {
    socket.join(`driver:${userId}`);
  }
  
  socket.on('join-bus', (busId) => {
    if (role === 'parent' && busId) {
      socket.join(`bus:${busId}`);
      console.log(`[Socket] Parent ${userId} joined bus:${busId}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${role} ${userId}`);
  });
});

initSocketManager(io);

// Connect to MongoDB
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
