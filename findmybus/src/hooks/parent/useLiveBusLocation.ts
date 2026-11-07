import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parentApi } from '../../api/parentApi';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import {
  connectSocket,
  attachSocketListeners,
  joinBusRoom,
  leaveBusRoom,
  getSocket,
  setActiveBusId,
} from '../../services/socketService';
import type { BusLocation, BusLocationHistory } from '../../types';
import { devLog, devWarn } from '../../utils/log';

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

  // Track whether socket listeners are already attached to prevent duplicates
  const listenersRef = useRef(false);

  // Initial fetch — current location only
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

  // Route history for the active trip — seeds the breadcrumb polyline when a
  // parent opens the app mid-trip. Live socket events extend it afterwards,
  // and trip:started invalidates it so a new trip refetches (empty) history.
  useQuery({
    queryKey: ['busPath', busId],
    queryFn: async () => {
      const { data } = await parentApi.getTripPath();
      if (!data.success) throw new Error(data.message);
      const points = Array.isArray(data.data) ? data.data : [];
      setBusPath(points);
      return points;
    },
    enabled: !!busId,
  });

  // Socket setup
  useEffect(() => {
    if (!busId || !accessToken) return;

    setActiveBusId(busId);
    const socket = connectSocket(accessToken);

    // If already connected, join the room immediately
    if (socket.connected) {
      setSocketConnected(true);
      joinBusRoom(busId);
    }

    // Attach listeners only once per socket instance (prevents duplicates on remount)
    if (!listenersRef.current) {
      listenersRef.current = true;
      const cleanup = attachSocketListeners(
        () => {
          setSocketConnected(true);
          joinBusRoom(busId);
        },
        () => {
          setSocketConnected(false);
        },
        (data: BusLocation & { timestamp?: number | string }) => {
          // Ignore late events belonging to a different trip (e.g. an
          // in-flight update from a trip that just ended) so the parent never
          // renders stale coordinates on a new trip.
          const currentTripId = useTripStore.getState().busLocation?.tripId;
          if (
            data.tripId &&
            currentTripId &&
            String(data.tripId) !== String(currentTripId)
          ) {
            devWarn(
              `[GPS][PARENT] ignored update from trip ${data.tripId} (current trip ${currentTripId})`,
            );
            return;
          }

          const newLoc: BusLocation = {
            active: true,
            tripId: data.tripId,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            speed: data.speed,
            heading: data.heading,
            // Server socket payload historically used `timestamp`; REST uses
            // `updatedAt`. Accept both so either backend version works.
            updatedAt: (data.updatedAt ?? data.timestamp) as string | undefined,
          };
          setBusLocation(newLoc);
          queryClient.setQueryData(['busLocation', busId], newLoc);
          devLog(
            `[GPS][PARENT] location:update tripId=${newLoc.tripId} lat=${newLoc.latitude?.toFixed(3)} lng=${newLoc.longitude?.toFixed(3)}`,
          );

          // Append to breadcrumb trail only after coordinate validation
          // (finite, in-range, not null-island) — narrows to number below.
          const rawLat = newLoc.latitude;
          const rawLng = newLoc.longitude;
          if (
            typeof rawLat === 'number' && Number.isFinite(rawLat) && Math.abs(rawLat) <= 90 &&
            typeof rawLng === 'number' && Number.isFinite(rawLng) && Math.abs(rawLng) <= 180 &&
            !(rawLat === 0 && rawLng === 0)
          ) {
            const last = queryClient.getQueryData<BusLocationHistory[]>([
              'busPath',
              busId,
            ]);

            let shouldAdd = true;
            if (last && last.length > 0) {
              const prev = last[last.length - 1];
              const dist = haversineMeters(
                prev.latitude,
                prev.longitude,
                rawLat,
                rawLng,
              );
              if (dist < MIN_DISTANCE_METERS) {
                shouldAdd = false;
              }
            }

            if (shouldAdd) {
              const point: BusLocationHistory = {
                latitude: rawLat,
                longitude: rawLng,
                accuracy: newLoc.accuracy,
                speed: newLoc.speed,
                heading: newLoc.heading,
                timestamp: Date.now(),
              };
              addBusPathPoint(point);
              queryClient.setQueryData(['busPath', busId], [
                ...(last ?? []),
                point,
              ]);
            }
          }
        },
        (data: { tripId: string; busId: string }) => {
          devLog(
            `[SOCKET][PARENT] trip:started tripId=${data.tripId} busId=${data.busId} — switching to live tracking`,
          );
          // Show the "trip started" state immediately, even before the first
          // GPS fix arrives; REST refetch then fills latest coordinates.
          setBusLocation({ active: true, tripId: data.tripId });
          queryClient.invalidateQueries({ queryKey: ['busLocation', busId] });
          queryClient.invalidateQueries({ queryKey: ['activeTrip'] });
          clearBusPath();
          // Refetch route history for the NEW trip (empty at start) so points
          // from the previous trip can never bleed into this one.
          queryClient.invalidateQueries({ queryKey: ['busPath', busId] });
        },
        (data: { tripId?: string }) => {
          devLog(`[SOCKET][PARENT] trip:ended tripId=${data?.tripId} — returning to idle state`);
          const inactive = { active: false };
          setBusLocation(inactive);
          queryClient.setQueryData(['busLocation', busId], inactive);
          queryClient.invalidateQueries({ queryKey: ['activeTrip'] });
          clearBusPath();
          queryClient.setQueryData(['busPath', busId], []);
        },
      );

      return () => {
        cleanup();
        listenersRef.current = false;
        leaveBusRoom();
      };
    }

    return () => {
      const s = getSocket();
      const authToken = (s?.auth as { token?: string } | undefined)?.token;
      if (s && s.connected && authToken === accessToken) {
        leaveBusRoom();
      }
    };
  }, [busId, accessToken, queryClient, setBusLocation, addBusPathPoint, clearBusPath, setSocketConnected]);

  return query;
}
