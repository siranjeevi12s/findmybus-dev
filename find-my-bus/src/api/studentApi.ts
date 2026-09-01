import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';
import { BusData, PaginatedResult } from './busApi';

export interface StudentData {
  _id: string;
  studentName: string;
  studentId: string;
  grade: string;
  section: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  busId: BusData | string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface GetStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const createStudent = async (payload: Omit<StudentData, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<StudentData>> => {
  const response = await axiosClient.post('/students', payload);
  return response.data;
};

export const getStudents = async (params: GetStudentsParams): Promise<ApiResponse<PaginatedResult<StudentData>>> => {
  const response = await axiosClient.get('/students', { params });
  return response.data;
};

export const getStudentById = async (id: string): Promise<ApiResponse<StudentData>> => {
  const response = await axiosClient.get(`/students/${id}`);
  return response.data;
};

export const updateStudent = async (id: string, payload: Partial<StudentData>): Promise<ApiResponse<StudentData>> => {
  const response = await axiosClient.put(`/students/${id}`, payload);
  return response.data;
};

export const deleteStudent = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axiosClient.delete(`/students/${id}`);
  return response.data;
};
