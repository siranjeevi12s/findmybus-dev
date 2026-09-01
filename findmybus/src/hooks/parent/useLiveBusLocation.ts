import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parentApi } from '../../api/parentApi';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { connectSocket, joinBusRoom, getSocket } from '../../services/socketService';
import type { BusLocation } from '../../types';

export function useLiveBusLocation(busId?: string) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setBusLocation = useTripStore((state) => state.setBusLocation);
  const setSocketConnected = useTripStore((state) => state.setSocketConnected);
  
  // Initial fetch
  const query = useQuery({
    queryKey: ['busLocation', busId],
    queryFn: async () => {
      const { data } = await parentApi.getBusLocation();
      if (!data.success) throw new Error(data.message);
      
      const loc = data.data;
      setBusLocation(loc);
      return loc;
    },
    enabled: !!busId,
    refetchInterval: 30000, // Fallback polling if socket fails
  });

  // Socket setup
  useEffect(() => {
    if (!busId || !accessToken) return;

    const socket = connectSocket(accessToken);
    
    socket.on('connect', () => {
      setSocketConnected(true);
      joinBusRoom(busId);
    });
    
    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('location:update', (data: BusLocation) => {
      const newLoc: BusLocation = {
        active: true,
        tripId: data.tripId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        updatedAt: data.updatedAt,
      };
      setBusLocation(newLoc);
      queryClient.setQueryData(['busLocation', busId], newLoc);
    });

    socket.on('trip:started', (data: { tripId: string, busId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['busLocation', busId] });
      queryClient.invalidateQueries({ queryKey: ['activeTrip'] });
    });

    socket.on('trip:ended', () => {
      const inactive = { active: false };
      setBusLocation(inactive);
      queryClient.setQueryData(['busLocation', busId], inactive);
      queryClient.invalidateQueries({ queryKey: ['activeTrip'] });
    });

    // connectSocket() reuses an already-connected socket, in which case the
    // 'connect' event above will never fire again — so join the room now.
    // Without this the parent silently receives no live updates on remount or
    // when the bus id changes.
    if (socket.connected) {
      setSocketConnected(true);
      joinBusRoom(busId);
    }

    // We don't disconnect on unmount, we just remove listeners if needed,
    // or keep it alive while the app is active.
    return () => {
      const s = getSocket();
      if (s) {
        s.off('connect');
        s.off('disconnect');
        s.off('location:update');
        s.off('trip:started');
        s.off('trip:ended');
      }
    };
  }, [busId, accessToken, queryClient, setBusLocation, setSocketConnected]);

  return query;
}
