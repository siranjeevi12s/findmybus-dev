import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  GetDriversParams,
  DriverData,
} from '../api/driverApi';

export const useDrivers = (params: GetDriversParams) => {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => getDrivers(params),
  });
};

export const useDriverDetails = (id: string) => {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: () => getDriverById(id),
    enabled: !!id,
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DriverData> }) =>
      updateDriver(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', variables.id] });
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};
