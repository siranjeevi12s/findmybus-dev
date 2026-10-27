import { io, Socket } from 'socket.io-client';
import env from '../env';
import { clearTokens } from '../api/axiosClient';
import { refreshMobileAccessToken } from './mobileTokenRefresh';

let socket: Socket | null = null;
let activeBusId: string | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function getActiveBusId(): string | null {
  return activeBusId;
}

export function setActiveBusId(busId: string | null): void {
  activeBusId = busId;
}

export function connectSocket(accessToken: string): Socket {
  // Reuse socket if same token, otherwise update auth and reconnect.
  // Previously we returned early on `socket?.connected` even if token had rotated (15m expiry),
  // leading to `[Socket] Invalid token` and no retry.
  if (socket) {
    const currentToken = (socket.auth as { token?: string } | undefined)?.token;
    if (currentToken === accessToken && socket.connected) return socket;
    if (currentToken !== accessToken) {
      socket.auth = { token: accessToken };
      // Force reconnect with new token if already connected/connecting
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
      return socket;
    }
    if (socket.connected) return socket;
  }

  socket = io(env.SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    // Re-join the active bus room after (re)connect so location updates resume.
    if (activeBusId && socket) {
      socket.emit('join-bus', activeBusId);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', async (err) => {
    console.warn('[Socket] Connection error:', err.message);

    // Auto-refresh on Invalid token / Authentication required.
    // Access token is 15m (Server/src/utils/mobileJwt.js:12), so parent staying on map >15m hits this.
    const isAuthError = err.message.includes('Invalid token') || err.message.includes('Authentication');
    if (!isAuthError || !socket) return;

    try {
      const newAccessToken = await refreshMobileAccessToken();
      // Dynamic import to avoid circular dependency with zustand
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.setState({ accessToken: newAccessToken });

      socket.auth = { token: newAccessToken };
      socket.connect();
      console.log('[Socket] Retrying with refreshed token');
    } catch (refreshErr) {
      console.warn('[Socket] Token refresh failed, need re-login', refreshErr);
      await clearTokens();
      const { useAuthStore } = await import('../store/authStore');
      await useAuthStore.getState().logout();
      disconnectSocket();
    }
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinBusRoom(busId: string): void {
  activeBusId = busId;
  socket?.emit('join-bus', busId);
}

export function leaveBusRoom(): void {
  activeBusId = null;
  socket?.emit('leave-bus', '');
}
