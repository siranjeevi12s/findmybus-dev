import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parentApi } from '../../api/parentApi';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { connectSocket, joinBusRoom, leaveBusRoom, getSocket, setActiveBusId } from '../../services/socketService';
import type { BusLocation, BusLocationHistory } from '../../types';

const MIN_DISTANCE_METERS = 5;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function useLiveBusLocation(busId?: string) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setBusLocation = useTripStore((state) => state.setBusLocation);
  const setBusPath = useTripStore((state) => state.setBusPath);
  const addBusPathPoint = useTripStore((state) => state.addBusPathPoint);
  const clearBusPath = useTripStore((state) => state.clearBusPath);
  const setSocketConnected = useTripStore((state) => state.setSocketConnected);

  // Initial fetch — current location only. Do NOT seed breadcrumb path
  // from history; the line should only appear once the driver starts the trip.
  const query = useQuery({
    queryKey: ['busLocation', busId],
    queryFn: async () => {
      const locRes = await parentApi.getBusLocation();
      if (!locRes.data.success) throw new Error(locRes.data.message);
      const loc = locRes.data.data;
      setBusLocation(loc);

      // Start with an empty path — lines appear only after trip starts.
      setBusPath([]);
      queryClient.setQueryData(['busPath', busId], []);

      return loc;
    },
    enabled: !!busId,
    refetchInterval: 30000, // Fallback polling if socket fails
  });

  // Socket setup
  useEffect(() => {
    if (!busId || !accessToken) return;

    setActiveBusId(busId);

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

      // Append to breadcrumb trail if we have a last point and it moved enough
      const last = queryClient.getQueryData<BusLocationHistory[]>([
        'busPath',
        busId,
      ]);
      if (last && last.length > 0) {
        const prev = last[last.length - 1];
        const dist = haversineMeters(
          prev.latitude,
          prev.longitude,
          newLoc.latitude ?? 0,
          newLoc.longitude ?? 0
        );
        if (dist >= MIN_DISTANCE_METERS) {
          addBusPathPoint({
            latitude: newLoc.latitude ?? 0,
            longitude: newLoc.longitude ?? 0,
            accuracy: newLoc.accuracy,
            speed: newLoc.speed,
            heading: newLoc.heading,
            timestamp: Date.now(),
          });
          queryClient.setQueryData(['busPath', busId], [
            ...last,
            {
              latitude: newLoc.latitude ?? 0,
              longitude: newLoc.longitude ?? 0,
              accuracy: newLoc.accuracy,
              speed: newLoc.speed,
              heading: newLoc.heading,
              timestamp: Date.now(),
            },
          ]);
        }
      } else {
        // Seed the path with the first point if empty
        addBusPathPoint({
          latitude: newLoc.latitude ?? 0,
          longitude: newLoc.longitude ?? 0,
          accuracy: newLoc.accuracy,
          speed: newLoc.speed,
          heading: newLoc.heading,
          timestamp: Date.now(),
        });
        queryClient.setQueryData(['busPath', busId], [
          {
            latitude: newLoc.latitude ?? 0,
            longitude: newLoc.longitude ?? 0,
            accuracy: newLoc.accuracy,
            speed: newLoc.speed,
            heading: newLoc.heading,
            timestamp: Date.now(),
          },
        ]);
      }
    });

    socket.on('trip:started', (data: { tripId: string; busId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['busLocation', busId] });
      queryClient.invalidateQueries({ queryKey: ['activeTrip'] });
      clearBusPath();
    });

    socket.on('trip:ended', () => {
      const inactive = { active: false };
      setBusLocation(inactive);
      queryClient.setQueryData(['busLocation', busId], inactive);
      queryClient.invalidateQueries({ queryKey: ['activeTrip'] });
      // Clear breadcrumb path when trip ends — lines only appear during an active trip.
      clearBusPath();
      queryClient.setQueryData(['busPath', busId], []);
    });

    // connectSocket() reuses an already-connected socket, in which case the
    // 'connect' event above will never fire again — so join the room now.
    if (socket.connected) {
      setSocketConnected(true);
      joinBusRoom(busId);
    }

    return () => {
      const s = getSocket();
      if (s) {
        s.off('connect');
        s.off('disconnect');
        s.off('location:update');
        s.off('trip:started');
        s.off('trip:ended');
      }
      leaveBusRoom();
    };
  }, [busId, accessToken, queryClient, setBusLocation, setBusPath, addBusPathPoint, clearBusPath, setSocketConnected]);

  return query;
}
