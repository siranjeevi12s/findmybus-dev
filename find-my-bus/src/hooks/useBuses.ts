import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
  GetBusesParams,
  BusData,
} from '../api/busApi';

export const useBuses = (params: GetBusesParams) => {
  return useQuery({
    queryKey: ['buses', params],
    queryFn: () => getBuses(params),
  });
};

export const useBusDetails = (id: string) => {
  return useQuery({
    queryKey: ['bus', id],
    queryFn: () => getBusById(id),
    enabled: !!id,
  });
};

export const useCreateBus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBus,
    onSuccess: () => {
      // Invalidate and refetch the buses list
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useUpdateBus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BusData> }) =>
      updateBus(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['bus', variables.id] });
    },
  });
};

export const useDeleteBus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};
