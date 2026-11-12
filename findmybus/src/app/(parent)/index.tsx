import { View, Text, ActivityIndicator } from 'react-native';
import type { NativeSyntheticEvent } from 'react-native';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type CameraRef, type ViewStateChangeEvent } from '@maplibre/maplibre-react-native';
import { useParentProfile } from '../../hooks/parent/useParentProfile';
import { useLiveBusLocation } from '../../hooks/parent/useLiveBusLocation';
import { useParentLocation } from '../../hooks/parent/useParentLocation';
import { useTripStore } from '../../store/tripStore';
import WaitingView from '../../components/parent/WaitingView';
import InfoPanel from '../../components/parent/InfoPanel';

import {
  STALE_LOCATION_MS,
  ZOOM_DEFAULT,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  ZOOM_ANIMATION_MS,
} from '../../components/parent/constants';

const LiveMap = lazy(() => import('../../components/parent/LiveMap'));

export default function ParentDashboard() {
  const { data: profile, isLoading: isProfileLoading } = useParentProfile();
  const { location: parentLoc } = useParentLocation();

  const busId = profile?.bus ? (typeof profile.bus === 'string' ? profile.bus : profile.bus._id) : undefined;
  useLiveBusLocation(busId);

  const busLocation = useTripStore((state) => state.busLocation);
  const busPath = useTripStore((state) => state.busPath);
  const isConnected = useTripStore((state) => state.isConnectedToSocket);

  // Raw latest target only. Smooth per-frame motion lives inside <BusMarker/>,
  // which subscribes to the store itself — this screen re-renders only when a
  // new target arrives or trip/connection state changes.
  const busLat = busLocation?.latitude;
  const busLng = busLocation?.longitude;
  const tripActive = !!busLocation?.active;
  const hasLocation = tripActive && busLat != null && busLng != null;

  const updatedAt = busLocation?.updatedAt;
  // Staleness is evaluated relative to the last render (triggered when a new
  // location arrives). We deliberately do NOT poll on a timer here: that used
  // to re-render the entire dashboard every 30s solely to recompute isStale.
  const isStale = useMemo(() => {
    if (!updatedAt) return false;
    const ts = Date.parse(String(updatedAt));
    return Number.isFinite(ts) && Date.now() - ts > STALE_LOCATION_MS;
  }, [updatedAt]);

  // ── Manual camera controls ────────────────────────────────────────────────
  // Zoom is declarative state so manual zoom survives the follow-camera stop
  // that re-applies on every GPS fix (an imperative zoomTo would be reset).
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const zoomRef = useRef(ZOOM_DEFAULT);
  const cameraRef = useRef<CameraRef>(null);
  const locateBusyRef = useRef(false);
  const [locateBusy, setLocateBusy] = useState(false);

  // ── Independent map / marker movement ─────────────────────────────────────
  // <BusMarker/> drives both the marker and the follow camera from one clock.
  // Follow state is a REF, not React state: a manual gesture must flip it
  // without re-rendering the map subtree, so panning/zooming stays native and
  // stutter-free. The marker and route keep moving until the user recenters.
  const isFollowingRef = useRef(true);
  const prevTripIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (busLat == null || busLng == null) return;
    const tripChanged =
      prevTripIdRef.current !== undefined &&
      String(prevTripIdRef.current) !== String(busLocation?.tripId ?? '');
    prevTripIdRef.current = busLocation?.tripId;
    if (tripChanged) {
      // A new trip always resumes following from its first fix.
      isFollowingRef.current = true;
    }
  }, [busLat, busLng, busLocation?.tripId]);

  const handleUserRegionChange = useCallback(
    (e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      // Stop before the gesture completes so a GPS fix cannot pull the map
      // back while the user is dragging or pinching. No state write: the ref
      // flip must not re-render the map mid-gesture.
      if (e.nativeEvent.userInteraction) {
        isFollowingRef.current = false;
      }
    },
    [],
  );

  const handleZoomIn = useCallback(() => {
    const targetZoom = Math.min(ZOOM_MAX, zoomRef.current + ZOOM_STEP);
    if (targetZoom === zoomRef.current) return;
    zoomRef.current = targetZoom;
    setZoom(targetZoom);
    cameraRef.current?.zoomTo(targetZoom, { duration: ZOOM_ANIMATION_MS });
  }, []);

  const handleZoomOut = useCallback(() => {
    const targetZoom = Math.max(ZOOM_MIN, zoomRef.current - ZOOM_STEP);
    if (targetZoom === zoomRef.current) return;
    zoomRef.current = targetZoom;
    setZoom(targetZoom);
    cameraRef.current?.zoomTo(targetZoom, { duration: ZOOM_ANIMATION_MS });
  }, []);

  // "Find the bus" — recenters the camera on the bus's latest position.
  // Useful after panning away or zooming; tracking data is untouched.
  const handleLocate = useCallback(async () => {
    if (locateBusyRef.current) return; // ignore rapid repeat presses
    if (busLat == null || busLng == null) return;
    locateBusyRef.current = true;
    setLocateBusy(true);
    try {
      // Recenter on the bus and normalize zoom. The imperative camera methods
      // are the only path that can correct a native zoom the user changed by
      // pinching (React state and native camera can drift apart).
      const targetZoom = Math.min(Math.max(zoom, 15), ZOOM_MAX);
      isFollowingRef.current = true;
      cameraRef.current?.easeTo({
        center: [busLng, busLat],
        zoom: targetZoom,
        duration: ZOOM_ANIMATION_MS,
        easing: 'ease',
      });
      if (targetZoom !== zoom) {
        zoomRef.current = targetZoom;
        setZoom(targetZoom);
      }
    } finally {
      locateBusyRef.current = false;
      setLocateBusy(false);
    }
  }, [busLat, busLng, zoom]);

  // Route polyline coordinates: validated historical GPS points + current raw
  // position. Same data source that drives <BusMarker/>'s animation.
  const routeCoordinates = useMemo(() => {
    const isValid = (lat?: number, lng?: number): boolean =>
      typeof lat === 'number' && typeof lng === 'number' &&
      Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
      !(lat === 0 && lng === 0);
    const coords: number[][] = busPath
      .filter((p) => isValid(p.latitude, p.longitude))
      .map((p) => [p.longitude as number, p.latitude as number]);
    if (hasLocation && isValid(busLat, busLng)) {
      coords.push([busLng, busLat]);
    }
    return coords;
  }, [busPath, hasLocation, busLat, busLng]);

  if (isProfileLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!profile?.bus) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-xl font-bold text-gray-800 text-center">No Bus Assigned</Text>
        <Text className="text-gray-500 text-center mt-2">
          {profile?.student?.studentName} is not currently assigned to any bus route.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Map Area */}
      <View className="flex-1 bg-slate-200">
        {hasLocation ? (
          <Suspense fallback={<View className="flex-1 bg-slate-200" />}>
            <LiveMap
            busLat={busLat}
            busLng={busLng}
            parentLoc={parentLoc}
            routeCoordinates={routeCoordinates}
            zoom={zoom}
            isFollowingRef={isFollowingRef}
            cameraRef={cameraRef}
            onRegionWillChange={handleUserRegionChange}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLocate={handleLocate}
            locateBusy={locateBusy}
          />
          </Suspense>
        ) : tripActive ? (
          // Trip started but no GPS fix received yet — distinct from "no trip"
          <WaitingView mode="waiting-fix" />
        ) : (
          <WaitingView mode="no-trip" />
        )}
      </View>

      <InfoPanel
        studentName={profile.student?.studentName}
        busNumber={typeof profile.bus !== 'string' ? profile.bus.busNumber : undefined}
        driverName={
          profile.driver ? `${profile.driver.firstName} ${profile.driver.lastName}` : undefined
        }
        isConnected={isConnected}
        isStale={isStale}
      />
    </View>
  );
}
