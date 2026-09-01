import { create } from 'zustand';
import type { Trip, BusLocation } from '../types';

type TrackingStatus = 'idle' | 'starting' | 'active' | 'stopping' | 'error';

interface TripState {
  currentTrip: Trip | null;
  trackingStatus: TrackingStatus;
  busLocation: BusLocation | null;
  isConnectedToSocket: boolean;
  hasNetworkError: boolean;

  setCurrentTrip: (trip: Trip | null) => void;
  setTrackingStatus: (status: TrackingStatus) => void;
  setBusLocation: (location: BusLocation) => void;
  setSocketConnected: (connected: boolean) => void;
  setNetworkError: (hasError: boolean) => void;
  reset: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentTrip: null,
  trackingStatus: 'idle',
  busLocation: null,
  isConnectedToSocket: false,
  hasNetworkError: false,

  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setTrackingStatus: (status) => set({ trackingStatus: status }),
  setBusLocation: (location) => set({ busLocation: location }),
  setSocketConnected: (connected) => set({ isConnectedToSocket: connected }),
  setNetworkError: (hasError) => set({ hasNetworkError: hasError }),
  reset: () =>
    set({
      currentTrip: null,
      trackingStatus: 'idle',
      busLocation: null,
      isConnectedToSocket: false,
      hasNetworkError: false,
    }),
}));
