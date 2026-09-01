import axiosClient from './axiosClient';
import type { ApiResponse, Driver, BusDriverAssignment, Trip } from '../types';

export const driverApi = {
  getProfile: () =>
    axiosClient.get<ApiResponse<Driver>>('/mobile/driver/profile'),

  getAssignment: () =>
    axiosClient.get<ApiResponse<BusDriverAssignment | null>>('/mobile/driver/assignment'),

  getCurrentTrip: () =>
    axiosClient.get<ApiResponse<Trip | null>>('/mobile/driver/trips/current'),

  startTrip: () =>
    axiosClient.post<ApiResponse<Trip>>('/mobile/driver/trips/start'),

  updateLocation: (
    tripId: string,
    payload: { latitude: number; longitude: number; accuracy?: number; speed?: number; heading?: number }
  ) =>
    axiosClient.post<ApiResponse<Trip>>(`/mobile/driver/trips/${tripId}/location`, payload),

  stopTrip: (tripId: string) =>
    axiosClient.post<ApiResponse<Trip>>(`/mobile/driver/trips/${tripId}/stop`),
};
