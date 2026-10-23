import { useEffect, useState } from 'react';
import { Linking, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useParentProfile } from '../../hooks/parent/useParentProfile';
import { useLiveBusLocation } from '../../hooks/parent/useLiveBusLocation';
import { useSmoothLocation } from '../../hooks/parent/useSmoothLocation';
import { useParentLocation } from '../../hooks/parent/useParentLocation';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import { useTripStore } from '../../store/tripStore';
import { estimateETA, formatETA } from '../../utils/eta';
import env from '../../env';

// MapLibre is a native module - it crashes in Expo Go (MLRNCameraModule not found).
// Lazy-require with fallback so the rest of the app (auth, profile) still works in Expo Go.
// In a native dev build (`npx expo run:android`) this will load normally.
let Map: any = null;
let Camera: any = null;
let Marker: any = null;
let GeoJSONSource: any = null;
let Layer: any = null;
let isMapLibreAvailable = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mapLibre = require('@maplibre/maplibre-react-native');
  Map = mapLibre.Map;
  Camera = mapLibre.Camera;
  Marker = mapLibre.Marker;
  GeoJSONSource = mapLibre.GeoJSONSource;
  Layer = mapLibre.Layer;
  isMapLibreAvailable = true;
} catch {
  isMapLibreAvailable = false;
}

export default function ParentDashboard() {
  const { data: profile, isLoading: isProfileLoading } = useParentProfile();
  const { location: parentLoc, permissionStatus } = useParentLocation();
  
  const busId = profile?.bus ? (typeof profile.bus === 'string' ? profile.bus : profile.bus._id) : undefined;
  useLiveBusLocation(busId);
  
  const busLocation = useTripStore((state) => state.busLocation);
  const busPath = useTripStore((state) => state.busPath);
  const isConnected = useTripStore((state) => state.isConnectedToSocket);
  const hasNetworkError = useTripStore((state) => state.hasNetworkError);

  const smoothBusLoc = useSmoothLocation(busLocation?.latitude, busLocation?.longitude);
  const { data: busPlaceName } = useReverseGeocode(busLocation?.latitude, busLocation?.longitude);

  // ETA: compute from parent location to bus location
  const parentLat = parentLoc?.latitude;
  const parentLng = parentLoc?.longitude;
  const busLat = smoothBusLoc?.lat ?? busLocation?.latitude;
  const busLng = smoothBusLoc?.lng ?? busLocation?.longitude;
  const etaMinutes =
    parentLat != null && parentLng != null && busLat != null && busLng != null
      ? estimateETA(busLat, busLng, parentLat, parentLng)
      : null;

  // Map starts zoomed out, then flies in to the live bus location.
  const [mapZoom, setMapZoom] = useState(4);
  const [autoZoomDone, setAutoZoomDone] = useState(false);

  useEffect(() => {
    if (!busLocation?.active) {
      // Trip ended — reset so the next trip starts zoomed out again.
      setMapZoom(4);
      setAutoZoomDone(false);
      return;
    }
    if (smoothBusLoc && !autoZoomDone) {
      const t = setTimeout(() => {
        setMapZoom(14);
        setAutoZoomDone(true);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [smoothBusLoc, busLocation?.active, autoZoomDone]);

  if (isProfileLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-xl font-bold text-gray-800 text-center">Location Permission Required</Text>
        <Text className="text-gray-500 text-center mt-4">
          Enable location access in Settings to see your position on the map.
        </Text>
        <TouchableOpacity
          className="mt-6 h-12 px-6 bg-blue-600 rounded-lg flex-row items-center justify-center"
          onPress={() => Linking.openSettings()}
        >
          <Text className="text-white font-semibold">Open Settings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!profile?.bus) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-xl font-bold text-gray-800 text-center">No Bus Assigned</Text>
        <Text className="text-gray-500 text-center mt-2">
          {profile?.student?.studentName || 'Student'} is not currently assigned to any bus route.
        </Text>
      </SafeAreaView>
    );
  }

  const hasLocation = busLocation?.active && smoothBusLoc;
  const busSpeedKmh =
    busLocation?.speed != null && Number.isFinite(busLocation.speed)
      ? Math.max(0, Math.round(busLocation.speed * 3.6))
      : 0;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      {/* Network status banner */}
      {!isConnected && (
        <View className="w-full bg-amber-100 border border-amber-300 p-3 px-4 flex-row items-center justify-between">
          <Text className="text-amber-800 text-sm font-medium">
            {hasNetworkError ? 'No internet connection' : 'Connecting to bus…'}
          </Text>
          {!isConnected && <Text className="text-amber-600 text-xs">{hasNetworkError ? 'Check your connection' : 'Live updates may be delayed'}</Text>}
        </View>
      )}

      {/* Map Area */}
      <View className="flex-1 bg-slate-200" style={{ position: 'relative' }}>
        {!isMapLibreAvailable ? (
          <View className="flex-1 justify-center items-center p-6 bg-yellow-50">
            <Text className="text-yellow-800 text-center font-bold">Map requires native build</Text>
            <Text className="text-gray-600 text-center text-sm mt-2">
              @maplibre/maplibre-react-native does not run in Expo Go.{'\n'}Run `npx expo run:android` to build a dev client with native code.{'\n'}Other features (login/profile) still work in Expo Go.
            </Text>
          </View>
        ) : hasLocation ? (
          <>
            <Map
              style={{ flex: 1 }}
              mapStyle={env.MAPTILER_STYLE_URL}
              logo={false}
              attribution={true}
            >
              <Camera
                zoom={mapZoom}
                center={[smoothBusLoc.lng, smoothBusLoc.lat]}
                easing="fly"
                duration={autoZoomDone ? 1000 : 2500}
              />

              {/* Parent Location Marker */}
              {parentLoc && (
                <Marker
                  id="parentMarker"
                  lngLat={[parentLoc.longitude, parentLoc.latitude]}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: '#22C55E',
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: '#ffffff',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>ME</Text>
                  </View>
                </Marker>
              )}

              {/* Bus route breadcrumb trail — drawn from trip start to current position */}
              {busPath.length >= 2 && (
                <GeoJSONSource
                  id="routeSource"
                  data={{
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: busPath.map((p) => [p.longitude, p.latitude]),
                    },
                  }}
                >
                  <Layer
                    id="routeLayer"
                    type="line"
                    style={{
                      lineColor: '#3B82F6',
                      lineWidth: 4,
                      lineDasharray: [4, 2],
                      lineOpacity: 0.8,
                    }}
                  />
                </GeoJSONSource>
              )}

              {/* Smooth Bus Marker with Emoji. Keep children static-sized:
                  the marker repositions every animation frame, so any text
                  inside it flickers. The locality label lives in the fixed
                  overlay chip below instead. */}
              <Marker
                id="busMarker"
                lngLat={[smoothBusLoc.lng, smoothBusLoc.lat]}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#ffffff',
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: '#3B82F6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>🚌</Text>
                </View>
              </Marker>
            </Map>
          </>
        ) : (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-gray-500 text-center text-lg">
              Bus is not currently on an active trip.
            </Text>
          </View>
        )}

        {/* Locality chip — fixed top-center overlay. Rendered outside <Map>
            so it never re-mounts with marker frames (no blinking), and only
            changes text when the rounded locality actually changes. */}
        {isMapLibreAvailable && !!hasLocation && !!busPlaceName && (
          <View className="absolute left-0 right-0 top-3 items-center" pointerEvents="none">
            <View className="bg-slate-900 rounded-full px-4 py-2 shadow-xl border border-slate-700 flex-row items-center">
              <Text className="text-white font-bold text-sm">📍 {busPlaceName.split(',')[0]}</Text>
            </View>
          </View>
        )}

        {/* Zoom controls overlay (must sit outside <Map> — plain Views
            inside the native map do not lay out reliably) */}
        {isMapLibreAvailable && !!hasLocation && (
          <View className="absolute right-3 top-3 flex-col gap-2">
            <TouchableOpacity
              className="w-10 h-10 bg-white rounded-full justify-center items-center shadow-lg border border-gray-200"
              onPress={() => setMapZoom(14)}
            >
              <Text className="text-lg">◎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 bg-white rounded-full justify-center items-center shadow-lg border border-gray-200"
              onPress={() => setMapZoom((z) => Math.max(2, z - 2))}
            >
              <Text className="text-xl font-bold text-gray-700">−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 bg-white rounded-full justify-center items-center shadow-lg border border-gray-200"
              onPress={() => setMapZoom((z) => Math.min(18, z + 2))}
            >
              <Text className="text-xl font-bold text-gray-700">+</Text>
            </TouchableOpacity>
          </View>
        )}

        {isMapLibreAvailable && !!hasLocation && (
          <View className="absolute bottom-4 left-4 right-4 items-center" pointerEvents="none">
            <View className="flex-row items-center rounded-2xl border border-slate-700 bg-slate-950/90 px-5 py-3 shadow-xl">
              <Text className="mr-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Bus speed
              </Text>
              <Text className="text-2xl font-bold text-white">{busSpeedKmh}</Text>
              <Text className="ml-1 text-sm font-semibold text-slate-300">km/h</Text>
            </View>
          </View>
        )}
      </View>

      {/* Info Panel Bottom */}
      <View className="bg-white p-5 rounded-t-3xl shadow-xl -mt-6">
        <View className="absolute right-5 top-5 flex-row items-center">
          <View className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <Text className="text-xs text-gray-500">{isConnected ? 'Live' : 'Connecting...'}</Text>
        </View>

        <Text className="text-gray-500 text-sm font-medium">Student</Text>
        <Text className="text-gray-900 text-xl font-bold mb-4">{profile.student?.studentName || 'Student'}</Text>
        
        <View className="flex-row justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-gray-500 text-xs">Bus Number</Text>
            <Text className="text-gray-900 font-bold text-lg">
              {typeof profile.bus !== 'string' ? profile.bus.busNumber : 'Unknown'}
            </Text>
            {busPlaceName && (
              <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
                📍 {busPlaceName}
              </Text>
            )}
            {etaMinutes != null && busLocation?.active && (
              <View className="mt-1">
                <Text className="text-blue-600 text-xs font-semibold">
                  🚌 {formatETA(etaMinutes)} away
                </Text>
              </View>
            )}
          </View>
          
          {profile.driver && (
            <View className="items-end">
              <Text className="text-gray-500 text-xs">Driver</Text>
              <Text className="text-gray-900 font-bold text-lg">
                {profile.driver.firstName} {profile.driver.lastName}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
