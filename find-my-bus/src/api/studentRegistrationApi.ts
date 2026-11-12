import axiosClient from './axiosClient';

export interface StudentRegistrationPayload {
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

export interface StudentRegistrationResponse {
  success: boolean;
  message: string;
}

export const registerStudent = async (
  payload: StudentRegistrationPayload,
): Promise<StudentRegistrationResponse> => {
  const response = await axiosClient.post<StudentRegistrationResponse>(
    '/mobile/parent/student',
    payload,
  );
  return response.data;
};
