import axiosClient from './axiosClient';
import type { ApiResponse, ParentProfile, Student, Bus, Trip, BusLocation } from '../types';

export const parentApi = {
  getProfile: () =>
    axiosClient.get<ApiResponse<ParentProfile>>('/mobile/parent/profile'),

  getStudent: () =>
    axiosClient.get<ApiResponse<Student>>('/mobile/parent/student'),

  getBus: () =>
    axiosClient.get<ApiResponse<Bus>>('/mobile/parent/bus'),

  getActiveTrip: () =>
    axiosClient.get<ApiResponse<Trip | null>>('/mobile/parent/active-trip'),

  getBusLocation: () =>
    axiosClient.get<ApiResponse<BusLocation>>('/mobile/parent/bus-location'),
};
