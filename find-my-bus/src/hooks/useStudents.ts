import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  GetStudentsParams,
  StudentData,
} from '../api/studentApi';

export const useStudents = (params: GetStudentsParams) => {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => getStudents(params),
  });
};

export const useStudentDetails = (id: string) => {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudentById(id),
    enabled: !!id,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<StudentData> }) =>
      updateStudent(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};
