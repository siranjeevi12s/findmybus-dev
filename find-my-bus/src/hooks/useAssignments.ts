import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  assignDriver,
  getAssignments,
  unassignDriver,
  GetAssignmentsParams,
} from '../api/assignmentApi';

export const useAssignments = (params: GetAssignmentsParams) => {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => getAssignments(params),
  });
};

export const useAssignDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
};

export const useUnassignDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unassignDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
};
