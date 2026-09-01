import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';
import { PaginatedResult } from './busApi';

export interface DriverData {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface GetDriversParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const createDriver = async (payload: Omit<DriverData, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<DriverData>> => {
  const response = await axiosClient.post('/drivers', payload);
  return response.data;
};

export const getDrivers = async (params: GetDriversParams): Promise<ApiResponse<PaginatedResult<DriverData>>> => {
  const response = await axiosClient.get('/drivers', { params });
  return response.data;
};

export const getDriverById = async (id: string): Promise<ApiResponse<DriverData>> => {
  const response = await axiosClient.get(`/drivers/${id}`);
  return response.data;
};

export const updateDriver = async (id: string, payload: Partial<DriverData>): Promise<ApiResponse<DriverData>> => {
  const response = await axiosClient.put(`/drivers/${id}`, payload);
  return response.data;
};

export const deleteDriver = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axiosClient.delete(`/drivers/${id}`);
  return response.data;
};
