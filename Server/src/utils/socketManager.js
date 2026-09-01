let _io = null;

/**
 * Initialize the Socket.IO instance (called once during server startup).
 * @param {import('socket.io').Server} io
 */
function initSocketManager(io) {
  _io = io;
}

/**
 * Get the global Socket.IO instance.
 * @returns {import('socket.io').Server | null}
 */
function getSocketManager() {
  return _io;
}

module.exports = { initSocketManager, getSocketManager };
