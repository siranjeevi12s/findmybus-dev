import { View, Text, ActivityIndicator } from 'react-native';

interface WaitingViewProps {
  mode: 'waiting-fix' | 'no-trip';
}

/**
 * Full-area placeholder shown in place of the live map when there is no
 * usable GPS position.
 *
 * - `waiting-fix`: the trip HAS started but no GPS fix has been received yet —
 *   a distinct state from "no trip" (spinner + reassuring copy).
 * - `no-trip`: the bus is simply not on an active trip.
 */
export default function WaitingView({ mode }: WaitingViewProps) {
  if (mode === 'waiting-fix') {
    return (
      <View className="flex-1 justify-center items-center p-6 gap-3">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 text-center text-lg">
          Trip started. Waiting for the bus location…
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center p-6">
      <Text className="text-gray-500 text-center text-lg">
        Bus is not currently on an active trip.
      </Text>
    </View>
  );
}
