import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';

export interface DashboardStats {
  totalBuses: number;
  totalDrivers: number;
  totalStudents: number;
  assignedStudents: number;
}

export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  const response = await axiosClient.get('/dashboard/stats');
  return response.data;
};
