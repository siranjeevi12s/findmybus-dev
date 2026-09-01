import axiosClient from './axiosClient';
import type { ApiResponse, Trip, LocationUpdate } from '../types';

export const tripApi = {
  startTrip: () =>
    axiosClient.post<ApiResponse<Trip>>('/mobile/driver/trips/start'),

  stopTrip: (tripId: string) =>
    axiosClient.post<ApiResponse<Trip>>(`/mobile/driver/trips/${tripId}/stop`),

  updateLocation: (tripId: string, location: Omit<LocationUpdate, 'timestamp'>) =>
    axiosClient.post<ApiResponse<void>>(`/mobile/driver/trips/${tripId}/location`, location),
};
