import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverProfile } from '../../hooks/driver/useDriverProfile';
import { useDriverAssignment } from '../../hooks/driver/useDriverAssignment';
import { useCurrentTrip } from '../../hooks/driver/useCurrentTrip';
import { useStartTrip } from '../../hooks/driver/useStartTrip';
import { useStopTrip } from '../../hooks/driver/useStopTrip';
import { useLocationTracking } from '../../hooks/trip/useLocationTracking';
import { formatDuration, formatDistance } from '../../utils/formatters';
import { useEffect, useState } from 'react';

export default function DriverDashboard() {
  const { data: profile, isLoading: isProfileLoading } = useDriverProfile();
  const { data: assignment, isLoading: isAssignmentLoading } = useDriverAssignment();
  const { data: currentTrip, isLoading: isTripLoading } = useCurrentTrip();
  
  const startTrip = useStartTrip();
  const stopTrip = useStopTrip();
  const { ensurePermissions, isActive, currentSpeedKmh, distanceCoveredKm } = useLocationTracking();
  
  const [duration, setDuration] = useState('00:00:00');

  useEffect(() => {
    if (currentTrip && currentTrip.status === 'active') {
      const interval = setInterval(() => {
        setDuration(formatDuration(currentTrip.startedAt));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setDuration('00:00:00');
    }
  }, [currentTrip]);

  if (isProfileLoading || isAssignmentLoading || isTripLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-driver-bg justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  const handleStart = async () => {
    const { foreground, background } = await ensurePermissions();

    if (!foreground) {
      Alert.alert('Permission Denied', 'Location permission is required to start a trip.');
      return;
    }

    if (!background) {
      Alert.alert(
        'Background Location Required',
        'Set location access to "Allow all the time" so parents keep seeing the bus while the app is in the background.'
      );
      return;
    }

    if (startTrip.isPending) return;
    startTrip.mutate(undefined, {
      onError: (error) => {
        Alert.alert('Could Not Start Trip', error instanceof Error ? error.message : 'Please try again.');
      },
    });
  };

  const handleStop = () => {
    if (!currentTrip) return;
    Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Trip', style: 'destructive', onPress: () => stopTrip.mutate(currentTrip._id) },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-driver-bg p-4">
      {/* Profile Card */}
      <View className="bg-driver-card p-4 rounded-xl mb-4 border border-slate-700">
        <Text className="text-gray-400 text-sm">Welcome back,</Text>
        <Text className="text-white text-xl font-bold">{profile?.firstName} {profile?.lastName}</Text>
        <Text className="text-gray-400 mt-1">
          {profile && typeof profile.schoolId === 'object' ? profile.schoolId.name : ''}
        </Text>
      </View>

      {/* Assignment Card */}
      <View className="bg-driver-card p-4 rounded-xl mb-4 border border-slate-700">
        <Text className="text-gray-400 text-sm mb-2">Assigned Bus</Text>
        {assignment ? (
          <View>
            <Text className="text-white text-2xl font-bold">{typeof assignment.busId !== 'string' ? assignment.busId.busNumber : 'Unknown'}</Text>
            <Text className="text-gray-400">Reg: {typeof assignment.busId !== 'string' ? assignment.busId.registrationNumber : 'Unknown'}</Text>
          </View>
        ) : (
          <Text className="text-red-400">No active assignment</Text>
        )}
      </View>

      {/* Trip Status Card */}
      <View className="bg-driver-card p-4 rounded-xl mb-4 border border-slate-700 flex-1 justify-center items-center">
        <Text className="text-gray-400 text-lg mb-4">
          {isActive ? 'Trip in Progress' : 'Ready to Start'}
        </Text>
        
        {isActive && (
          <View className="flex-col items-center gap-4">
            <Text className="text-white text-4xl font-mono mb-2 font-bold">{duration}</Text>
            <View className="flex-row gap-4 text-gray-300 text-sm">
              <View className="flex-col items-center">
                <Text className="text-gray-400 text-xs uppercase">Speed</Text>
                <Text className="text-white font-bold">{Math.round(currentSpeedKmh)} km/h</Text>
              </View>
              <View className="flex-col items-center">
                <Text className="text-gray-400 text-xs uppercase">Distance</Text>
                <Text className="text-white font-bold">{formatDistance(distanceCoveredKm)}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          className={`w-full h-16 rounded-full flex-row items-center justify-center ${isActive ? 'bg-red-500' : 'bg-green-500'}`}
          onPress={isActive ? handleStop : handleStart}
          disabled={!assignment || startTrip.isPending || stopTrip.isPending}
        >
          {startTrip.isPending || stopTrip.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-xl uppercase tracking-wider">
              {isActive ? 'Stop Trip' : 'Start Trip'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
