import { memo } from 'react';
import { View, Text } from 'react-native';

/**
 * Bottom info panel — memoized so per-frame marker animation and GPS churn
 * never re-render it (it only depends on profile + connection state).
 */
export const InfoPanel = memo(function InfoPanel({
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

        <View className="items-end">
          <Text className="text-gray-500 text-xs">Driver</Text>
          <Text className="text-gray-900 font-bold text-lg">
            {driverName || 'Not assigned'}
          </Text>
        </View>
      </View>

      {isStale && (
        <Text className="text-amber-600 text-xs mt-2">
          Last known position — the bus has not reported recently.
        </Text>
      )}
    </View>
  );
});

export default InfoPanel;
