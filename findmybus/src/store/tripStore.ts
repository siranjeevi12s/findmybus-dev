import { create } from 'zustand';
import type { Trip, BusLocation, BusLocationHistory } from '../types';

type TrackingStatus = 'idle' | 'starting' | 'active' | 'stopping' | 'error';

interface TripState {
  currentTrip: Trip | null;
  trackingStatus: TrackingStatus;
  busLocation: BusLocation | null;
  busPath: BusLocationHistory[];
  isConnectedToSocket: boolean;
  hasNetworkError: boolean;

  setCurrentTrip: (trip: Trip | null) => void;
  setTrackingStatus: (status: TrackingStatus) => void;
  setBusLocation: (location: BusLocation) => void;
  setBusPath: (path: BusLocationHistory[]) => void;
  addBusPathPoint: (point: BusLocationHistory) => void;
  clearBusPath: () => void;
  setSocketConnected: (connected: boolean) => void;
  setNetworkError: (hasError: boolean) => void;
  reset: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentTrip: null,
  trackingStatus: 'idle',
  busLocation: null,
  busPath: [],
  isConnectedToSocket: false,
  hasNetworkError: false,

  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setTrackingStatus: (status) => set({ trackingStatus: status }),
  setBusLocation: (location) => set({ busLocation: location }),
  setBusPath: (path) => set({ busPath: path }),
  addBusPathPoint: (point) =>
    set((state) => {
      // Filter duplicates: skip if same as last point
      const last = state.busPath[state.busPath.length - 1];
      if (last && last.latitude === point.latitude && last.longitude === point.longitude) {
        return state;
      }
      const updated = [...state.busPath, point];
      // Cap at 500 points to prevent memory growth
      if (updated.length > 500) updated.shift();
      return { busPath: updated };
    }),
  clearBusPath: () => set({ busPath: [] }),
  setSocketConnected: (connected) => set({ isConnectedToSocket: connected }),
  setNetworkError: (hasError) => set({ hasNetworkError: hasError }),
  reset: () =>
    set({
      currentTrip: null,
      trackingStatus: 'idle',
      busLocation: null,
      busPath: [],
      isConnectedToSocket: false,
      hasNetworkError: false,
    }),
}));
