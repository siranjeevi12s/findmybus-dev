import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useDriverProfile } from '../../hooks/driver/useDriverProfile';
import { useDriverAssignment } from '../../hooks/driver/useDriverAssignment';
import { useCurrentTrip } from '../../hooks/driver/useCurrentTrip';
import { useStartTrip } from '../../hooks/driver/useStartTrip';
import { useStopTrip } from '../../hooks/driver/useStopTrip';
import { useLocationTracking } from '../../hooks/trip/useLocationTracking';
import { formatDuration } from '../../utils/formatters';
import { useEffect, useState } from 'react';

export default function DriverDashboard() {
  const { data: profile, isLoading: isProfileLoading } = useDriverProfile();
  const { data: assignment, isLoading: isAssignmentLoading } = useDriverAssignment();
  const { data: currentTrip, isLoading: isTripLoading } = useCurrentTrip();
  
  const startTrip = useStartTrip();
  const stopTrip = useStopTrip();
  const { ensurePermissions, isActive } = useLocationTracking();
  
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
      <View className="flex-1 bg-driver-bg justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
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
    <View className="flex-1 bg-driver-bg p-4">
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
          <Text className="text-white text-4xl font-mono mb-8 font-bold">{duration}</Text>
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
    </View>
  );
}
