import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserRole } from '../types';

const KEYS = {
  USER_ID: 'findmybus_user_id',
  USER_ROLE: 'findmybus_user_role',
  USER_EMAIL: 'findmybus_user_email',
  ACCESS_TOKEN: 'findmybus_access_token',
  REFRESH_TOKEN: 'findmybus_refresh_token',
};

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  role: UserRole | null;
  email: string | null;
  accessToken: string | null;
  refreshToken: string | null;

  login: (data: {
    userId: string;
    role: UserRole;
    email: string;
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setAccessToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  role: null,
  email: null,
  accessToken: null,
  refreshToken: null,

  login: async ({ userId, role, email, accessToken, refreshToken }) => {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.USER_ID, userId),
      SecureStore.setItemAsync(KEYS.USER_ROLE, role),
      SecureStore.setItemAsync(KEYS.USER_EMAIL, email),
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
    set({ isAuthenticated: true, userId, role, email, accessToken, refreshToken, isLoading: false });
  },

  logout: async () => {
    await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)));
    set({ isAuthenticated: false, userId: null, role: null, email: null, accessToken: null, refreshToken: null, isLoading: false });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const [userId, role, email, accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(KEYS.USER_ID),
        SecureStore.getItemAsync(KEYS.USER_ROLE),
        SecureStore.getItemAsync(KEYS.USER_EMAIL),
        SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
      ]);
      if (userId && role && accessToken) {
        set({ isAuthenticated: true, userId, role: role as UserRole, email, accessToken, refreshToken, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setAccessToken: async (token: string) => {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
    set({ accessToken: token });
  },
}));
