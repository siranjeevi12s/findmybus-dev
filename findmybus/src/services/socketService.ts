import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import env from '../env';

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
      const refreshToken = await SecureStore.getItemAsync('findmybus_refresh_token');
      if (!refreshToken) return;

      // Use fetch/axios without interceptors to avoid loop - call refresh endpoint directly
      const res = await fetch(`${env.API_BASE_URL}/mobile/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken }),
      });
      const json = await res.json();
      if (!json.success || !json.data?.accessToken) throw new Error(json.message || 'Refresh failed');

      const newAccessToken: string = json.data.accessToken;
      await SecureStore.setItemAsync('findmybus_access_token', newAccessToken);
      // Dynamic import to avoid circular dependency with zustand
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.setState({ accessToken: newAccessToken });

      socket.auth = { token: newAccessToken };
      socket.connect();
      console.log('[Socket] Retrying with refreshed token');
    } catch (refreshErr) {
      console.warn('[Socket] Token refresh failed, need re-login', refreshErr);
      // Optional: clear socket so UI can prompt login
      // disconnectSocket();
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
