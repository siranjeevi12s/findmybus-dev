import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';
import { BusData } from './busApi';
import { DriverData } from './driverApi';
import { PaginatedResult } from './busApi';

export interface AssignmentData {
  _id: string;
  busId: BusData | string; // Can be populated object or ID string
  driverId: DriverData | string;
  assignedAt: string;
  unassignedAt?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface GetAssignmentsParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | '';
}

export const assignDriver = async (payload: { busId: string; driverId: string }): Promise<ApiResponse<AssignmentData>> => {
  const response = await axiosClient.post('/bus-driver-assignments', payload);
  return response.data;
};

export const getAssignments = async (params: GetAssignmentsParams): Promise<ApiResponse<PaginatedResult<AssignmentData>>> => {
  const response = await axiosClient.get('/bus-driver-assignments', { params });
  return response.data;
};

export const unassignDriver = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axiosClient.delete(`/bus-driver-assignments/${id}`);
  return response.data;
};
