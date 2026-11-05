import { View, Text, ActivityIndicator } from 'react-native';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Map, Camera, Marker, GeoJSONSource, Layer, type CameraRef } from '@maplibre/maplibre-react-native';
import { useParentProfile } from '../../hooks/parent/useParentProfile';
import { useLiveBusLocation } from '../../hooks/parent/useLiveBusLocation';
import { useParentLocation } from '../../hooks/parent/useParentLocation';
import { useTripStore } from '../../store/tripStore';
import BusMarker from '../../components/BusMarker';
import MapControls from '../../components/MapControls';
import env from '../../env';

const STALE_LOCATION_MS = 90_000;

// Zoom bounds for the manual controls (MapTiler streets is useful to ~18)
const ZOOM_DEFAULT = 14;
const ZOOM_MIN = 5;
const ZOOM_MAX = 18;
const ZOOM_STEP = 1.5;

/**
 * Bottom info panel — memoized so per-frame marker animation and GPS churn
 * never re-render it (it only depends on profile + connection state).
 */
const InfoPanel = memo(function InfoPanel({
  studentName,
  busNumber,
  driverName,
  isConnected,
  isStale,
}: {
  studentName?: string;
  busNumber?: string;
  driverName?: string;
  isConnected: boolean;
  isStale: boolean;
}) {
  return (
    <View className="bg-white p-5 rounded-t-3xl shadow-xl -mt-6">
      <View className="absolute right-5 top-5 flex-row items-center">
        <View className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <Text className="text-xs text-gray-500">{isConnected ? 'Live' : 'Connecting...'}</Text>
      </View>

      <Text className="text-gray-500 text-sm font-medium">Student</Text>
      <Text className="text-gray-900 text-xl font-bold mb-4">{studentName}</Text>

      <View className="flex-row justify-between mb-2">
        <View>
          <Text className="text-gray-500 text-xs">Bus Number</Text>
          <Text className="text-gray-900 font-bold text-lg">{busNumber ?? 'Unknown'}</Text>
        </View>

        {!!driverName && (
          <View className="items-end">
            <Text className="text-gray-500 text-xs">Driver</Text>
            <Text className="text-gray-900 font-bold text-lg">{driverName}</Text>
          </View>
        )}
      </View>

      {isStale && (
        <Text className="text-amber-600 text-xs mt-2">
          Last known position — the bus has not reported recently.
        </Text>
      )}
    </View>
  );
});

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

  const isStale = useMemo(() => {
    if (!busLocation?.updatedAt) return false;
    const ts = Date.parse(String(busLocation.updatedAt));
    return Number.isFinite(ts) && Date.now() - ts > STALE_LOCATION_MS;
  }, [busLocation?.updatedAt]);

  // ── Manual camera controls ────────────────────────────────────────────────
  // Zoom is declarative state so manual zoom survives the follow-camera stop
  // that re-applies on every GPS fix (an imperative zoomTo would be reset).
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const cameraRef = useRef<CameraRef>(null);
  const locateBusyRef = useRef(false);
  const [locateBusy, setLocateBusy] = useState(false);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
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
      cameraRef.current?.jumpTo({ center: [busLng, busLat] });
      cameraRef.current?.zoomTo(targetZoom, { duration: 600 });
      if (targetZoom !== zoom) {
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
          <Map
            style={{ flex: 1 }}
            mapStyle={env.MAPTILER_STYLE_URL}
            logo={false}
            attribution={true}
          >
            {/* Camera follows the RAW latest target with a native fly
                animation — updated only per GPS fix (seconds apart), never
                per animation frame. Zoom is manual-control driven. */}
            <Camera
              ref={cameraRef}
              zoom={zoom}
              minZoom={ZOOM_MIN}
              maxZoom={ZOOM_MAX}
              center={[busLng, busLat]}
              easing="fly"
              duration={1500}
            />

            {/* Parent Location Marker */}
            {parentLoc && (
              <Marker
                key="parentMarker"
                id="parentMarker"
                lngLat={[parentLoc.longitude, parentLoc.latitude]}
              >
                <View className="w-8 h-8 bg-green-500 rounded-full border-2 border-white justify-center items-center shadow-md">
                  <Text className="text-white text-[10px] font-bold">ME</Text>
                </View>
              </Marker>
            )}

            {/* Breadcrumb trail of the bus's travelled path (historical GPS
                points + current position). No parent-to-bus connector line —
                the route only ever follows the bus's own coordinates. */}
            {routeCoordinates.length >= 2 && (
              <GeoJSONSource
                key="busPathSource"
                id="busPathSource"
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: routeCoordinates,
                  },
                }}
              >
                <Layer
                  key="busPathLayer"
                  id="busPathLayer"
                  type="line"
                  paint={{
                    "line-color": '#3B82F6',
                    "line-width": 4,
                    "line-opacity": 0.7,
                  }}
                />
              </GeoJSONSource>
            )}

            {/* Self-animating bus marker (isolated re-render scope) */}
            <BusMarker />
          </Map>
        ) : tripActive ? (          // Trip started but no GPS fix received yet — distinct from "no trip"
          <View className="flex-1 justify-center items-center p-6 gap-3">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 text-center text-lg">
              Trip started. Waiting for the bus location…
            </Text>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-gray-500 text-center text-lg">
              Bus is not currently on an active trip.
            </Text>
          </View>
        )}

        {/* Floating controls rendered AFTER the Map so they sit above the
            native map surface; only shown while the live map is visible. */}
        {hasLocation && (
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLocate={handleLocate}
            zoomInDisabled={zoom >= ZOOM_MAX}
            zoomOutDisabled={zoom <= ZOOM_MIN}
            locateBusy={locateBusy}
          />
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
