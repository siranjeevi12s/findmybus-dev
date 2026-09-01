import { View, Text, ActivityIndicator } from 'react-native';
import { Map, Camera, Marker, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { useParentProfile } from '../../hooks/parent/useParentProfile';
import { useLiveBusLocation } from '../../hooks/parent/useLiveBusLocation';
import { useSmoothLocation } from '../../hooks/parent/useSmoothLocation';
import { useParentLocation } from '../../hooks/parent/useParentLocation';
import { useTripStore } from '../../store/tripStore';
import env from '../../env';

export default function ParentDashboard() {
  const { data: profile, isLoading: isProfileLoading } = useParentProfile();
  const parentLoc = useParentLocation();
  
  const busId = profile?.bus ? (typeof profile.bus === 'string' ? profile.bus : profile.bus._id) : undefined;
  useLiveBusLocation(busId);
  
  const busLocation = useTripStore((state) => state.busLocation);
  const isConnected = useTripStore((state) => state.isConnectedToSocket);
  
  const smoothBusLoc = useSmoothLocation(busLocation?.latitude, busLocation?.longitude);

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
          {profile?.studentname} is not currently assigned to any bus route.
        </Text>
      </View>
    );
  }

  const hasLocation = busLocation?.active && smoothBusLoc;

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
            <Camera
              zoom={14}
              center={[smoothBusLoc.lng, smoothBusLoc.lat]}
              easing="fly"
              duration={1000}
            />

            {/* Parent Location Marker */}
            {parentLoc && (
              <Marker
                id="parentMarker"
                lngLat={[parentLoc.longitude, parentLoc.latitude]}
              >
                <View className="w-8 h-8 bg-green-500 rounded-full border-2 border-white justify-center items-center shadow-md">
                  <Text className="text-white text-[10px] font-bold">ME</Text>
                </View>
              </Marker>
            )}

            {/* Path between Parent and Bus */}
            {parentLoc && (
              <GeoJSONSource
                id="routeSource"
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [parentLoc.longitude, parentLoc.latitude],
                      [smoothBusLoc.lng, smoothBusLoc.lat]
                    ]
                  }
                }}
              >
                <Layer
                  id="routeLayer"
                  type="line"
                  style={{
                    lineColor: '#3B82F6',
                    lineWidth: 4,
                    lineDasharray: [2, 2],
                    lineOpacity: 0.7
                  }}
                />
              </GeoJSONSource>
            )}

            {/* Smooth Bus Marker with Emoji */}
            <Marker
              id="busMarker"
              lngLat={[smoothBusLoc.lng, smoothBusLoc.lat]}
            >
              <View className="w-12 h-12 bg-white rounded-full border-2 border-blue-500 justify-center items-center shadow-xl">
                <Text className="text-2xl">🚌</Text>
              </View>
            </Marker>
          </Map>
        ) : (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-gray-500 text-center text-lg">
              Bus is not currently on an active trip.
            </Text>
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
        <Text className="text-gray-900 text-xl font-bold mb-4">{profile.studentName}</Text>
        
        <View className="flex-row justify-between mb-2">
          <View>
            <Text className="text-gray-500 text-xs">Bus Number</Text>
            <Text className="text-gray-900 font-bold text-lg">
              {typeof profile.bus !== 'string' ? profile.bus.busNumber : 'Unknown'}
            </Text>
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
    </View>
  );
}
