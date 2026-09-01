import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';

export interface BusData {
  _id: string;
  busNumber: string;
  registrationNumber: string;
  busType: 'Standard' | 'Minibus' | 'Coach';
  capacity: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface GetBusesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  buses?: T[];
  drivers?: T[];
  students?: T[];
  assignments?: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const createBus = async (payload: Omit<BusData, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<BusData>> => {
  const response = await axiosClient.post('/buses', payload);
  return response.data;
};

export const getBuses = async (params: GetBusesParams): Promise<ApiResponse<PaginatedResult<BusData>>> => {
  const response = await axiosClient.get('/buses', { params });
  return response.data;
};

export const getBusById = async (id: string): Promise<ApiResponse<BusData>> => {
  const response = await axiosClient.get(`/buses/${id}`);
  return response.data;
};

export const updateBus = async (id: string, payload: Partial<BusData>): Promise<ApiResponse<BusData>> => {
  const response = await axiosClient.put(`/buses/${id}`, payload);
  return response.data;
};

export const deleteBus = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axiosClient.delete(`/buses/${id}`);
  return response.data;
};
