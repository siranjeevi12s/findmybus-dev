import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function SelectRoleScreen() {
  const router = useRouter();

  const handleSelect = (role: 'driver' | 'parent') => {
    router.push({ pathname: '/(auth)/login', params: { role } });
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-gray-900 mb-2">FindMyBus</Text>
      <Text className="text-gray-500 mb-12 text-center">Select your role</Text>

      <Pressable
        className="w-full h-14 rounded-lg flex-row items-center justify-center border-2 border-gray-300 mb-4"
        onPress={() => handleSelect('driver')}
      >
        <Text className="text-lg font-semibold text-gray-700">Driver</Text>
      </Pressable>

      <Pressable
        className="w-full h-14 rounded-lg flex-row items-center justify-center border-2 border-gray-300 mb-8"
        onPress={() => handleSelect('parent')}
      >
        <Text className="text-lg font-semibold text-gray-700">Parent</Text>
      </Pressable>
    </View>
  );
}
