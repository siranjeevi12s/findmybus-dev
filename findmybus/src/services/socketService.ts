import { io, Socket } from 'socket.io-client';
// eslint-disable-next-line import/no-named-as-default
import env from '../env';
import { useTripStore } from '../store/tripStore';
import { devLog } from '../utils/log';

let socket: Socket | null = null;
let currentToken: string | null = null;
let activeBusId: string | null = null;
let tokenRefreshInFlight = false;

export function getSocket(): Socket | null {
  return socket;
}

export function getSocketToken(): string | null {
  return currentToken;
}

export function getActiveBusId(): string | null {
  return activeBusId;
}

export function setSocketToken(token: string): void {
  currentToken = token;
  if (socket) {
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
  }
}

export function setActiveBusId(busId: string | null): void {
  activeBusId = busId;
  if (socket?.connected && busId) {
    socket.emit('join-bus', busId);
  }
}

export function connectSocket(accessToken: string): Socket {
  currentToken = accessToken;

  // ALWAYS reuse the single socket instance. Creating a second io() while one
  // already exists orphans the first (it keeps reconnecting forever and its
  // connect/disconnect handlers fight over the connection status), produces
  // duplicate room joins, and can leave trip/location listeners bound to the
  // wrong instance — the parent then sticks on "Connecting..." and misses
  // updates. Only ever construct a socket when none exists yet.
  if (socket) {
    const existingToken = (socket.auth as { token?: string } | undefined)?.token;
    if (existingToken !== accessToken) {
      socket.auth = { token: accessToken };
      if (socket.connected) {
        socket.disconnect();
      }
    }
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  const instance = io(env.SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
    // Keep retrying: a parent app left open between trips must survive token
    // expiry (15m TTL) and network drops. Recovery is driven by the
    // connect_error handler below refreshing the auth token.
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  });
  socket = instance;

  instance.on('connect', () => {
    useTripStore.getState().setSocketConnected(true);
    useTripStore.getState().setNetworkError(false);
    // Re-join the bus room on (re)connect so location updates resume
    if (activeBusId) {
      instance.emit('join-bus', activeBusId);
    }
    devLog(`[SOCKET][PARENT] connected socketId=${instance.id} joinedRoom=${activeBusId ?? 'none'}`);
  });

  instance.on('disconnect', (reason) => {
    useTripStore.getState().setSocketConnected(false);
    console.warn(`[SOCKET][PARENT] disconnected reason=${reason}`);
  });

  instance.on('connect_error', async (err) => {
    useTripStore.getState().setSocketConnected(false);
    useTripStore.getState().setNetworkError(true);
    console.warn('[SOCKET][PARENT] connect_error:', err.message);
    // The server rejects handshakes with "Invalid token" when the short-lived
    // access token expired. Refresh it via the REST auth layer and reconnect,
    // instead of letting socket.io retry forever with a dead token.
    if (err.message === 'Invalid token' && !tokenRefreshInFlight) {
      tokenRefreshInFlight = true;
      try {
        const { refreshSocketToken } = await import('../api/axiosClient');
        await refreshSocketToken();
        devLog('[SOCKET][PARENT] token refreshed, reconnecting socket');
      } catch (refreshErr) {
        console.warn(
          '[SOCKET][PARENT] token refresh failed:',
          (refreshErr as Error)?.message ?? refreshErr,
        );
      } finally {
        tokenRefreshInFlight = false;
      }
    }
  });
  return socket;
}

export function attachSocketListeners(
  onConnect: () => void,
  onDisconnect: () => void,
  onLocationUpdate: (data: any) => void,
  onTripStarted: (data: any) => void,
  onTripEnded: (data: any) => void,
): () => void {
  if (!socket) return () => {};

  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.on('location:update', onLocationUpdate);
  socket.on('trip:started', onTripStarted);
  socket.on('trip:ended', onTripEnded);

  return () => {
    socket?.off('connect', onConnect);
    socket?.off('disconnect', onDisconnect);
    socket?.off('location:update', onLocationUpdate);
    socket?.off('trip:started', onTripStarted);
    socket?.off('trip:ended', onTripEnded);
  };
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
    activeBusId = null;
  }
}

export function joinBusRoom(busId: string): void {
  activeBusId = busId;
  socket?.emit('join-bus', busId);
  devLog(`[SOCKET][PARENT] join-bus room=bus:${busId}`);
}

export function leaveBusRoom(): void {
  activeBusId = null;
  socket?.emit('leave-bus', '');
}
