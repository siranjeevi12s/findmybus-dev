import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function ParentLayout() {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#3B82F6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} className="mr-4">
            <Text className="text-white font-semibold">Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Bus Tracker' }} />
    </Stack>
  );
}
