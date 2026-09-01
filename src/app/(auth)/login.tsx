import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSendOtp } from '../../hooks/auth/useSendOtp';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const sendOtp = useSendOtp();

  const handleSendOtp = () => {
    if (!email) return;
    sendOtp.mutate(email, {
      onSuccess: () => {
        router.push({ pathname: '/(auth)/verify-otp', params: { email } });
      },
    });
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-gray-900 mb-2">FindMyBus</Text>
      <Text className="text-gray-500 mb-8">Enter your registered email address to login.</Text>

      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
        <TextInput
          className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
          placeholder="e.g. driver@school.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        className="w-full h-12 bg-primary-600 rounded-lg flex-row items-center justify-center"
        onPress={handleSendOtp}
        disabled={sendOtp.isPending || !email}
      >
        {sendOtp.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white font-semibold text-lg">Send Verification Code</Text>
        )}
      </TouchableOpacity>
      
      {sendOtp.isError && (
        <Text className="text-red-500 text-center mt-4 text-sm">{sendOtp.error.message}</Text>
      )}
    </View>
  );
}
