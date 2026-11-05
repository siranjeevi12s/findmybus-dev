import axiosClient from './axiosClient';
import type { ApiResponse, ParentProfile, Student, Bus, Trip, BusLocation, BusLocationHistory } from '../types';

export interface CreateStudentPayload {
  studentName: string;
  studentId: string;
  grade: string;
  section: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  busNumber: string;
  schoolName: string;
  schoolEmail: string;
}

export const parentApi = {
  getProfile: () =>
    axiosClient.get<ApiResponse<ParentProfile>>('/mobile/parent/profile'),

  getStudent: () =>
    axiosClient.get<ApiResponse<Student>>('/mobile/parent/student'),

  // Public endpoint (no auth): creates School (if missing), Bus (if missing) and Student.
  createStudent: (payload: CreateStudentPayload) =>
    axiosClient.post<ApiResponse<Student>>('/mobile/parent/student', {
      studentName: payload.studentName,
      studentId: payload.studentId,
      grade: payload.grade,
      section: payload.section,
      parentName: payload.parentName,
      parentEmail: payload.parentEmail,
      parentPhone: payload.parentPhone,
      busNumber: payload.busNumber,
      schoolName: payload.schoolName,
      schoolEmail: payload.schoolEmail,
    }),

  getBus: () =>
    axiosClient.get<ApiResponse<Bus>>('/mobile/parent/bus'),

  getActiveTrip: () =>
    axiosClient.get<ApiResponse<Trip | null>>('/mobile/parent/active-trip'),

  getBusLocation: () =>
    axiosClient.get<ApiResponse<BusLocation>>('/mobile/parent/bus-location'),

  // Breadcrumb trail of the active trip (oldest-first) for parents who open
  // the app mid-trip. Server derives the bus from the token.
  getTripPath: () =>
    axiosClient.get<ApiResponse<BusLocationHistory[]>>('/mobile/parent/trip-locations'),
};
