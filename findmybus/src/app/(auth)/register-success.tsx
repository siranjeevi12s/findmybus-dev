import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';

export default function RegisterSuccessScreen() {
  const { email, school } = useLocalSearchParams<{ email?: string; school?: string }>();
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-green-50 px-6">
      <View className="w-16 h-16 bg-green-100 rounded-full flex-row items-center justify-center mb-6">
        <Text className="text-2xl">&#10004;</Text>
      </View>

      <Text className="text-2xl font-bold text-gray-900 mb-2">Student Registered!</Text>
      <Text className="text-gray-600 text-center mb-8">
        The student profile for{' '}
        <Text className="font-semibold text-gray-900">{email}</Text>{' '}
        has been created successfully under school{' '}
        <Text className="font-semibold text-gray-900">{school}</Text>.
      </Text>

      <TouchableOpacity
        className="w-full h-12 bg-primary-600 rounded-lg flex-row items-center justify-center"
        onPress={() => router.replace('/(auth)/login')}
      >
        <Text className="text-white font-semibold text-lg">Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
}
