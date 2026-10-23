import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVerifyOtp } from '../../hooks/auth/useVerifyOtp';
import { useSendOtp } from '../../hooks/auth/useSendOtp';
import { useQueryClient } from '@tanstack/react-query';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useSendOtp();

  const handleVerify = () => {
    if (!otp || otp.length !== 6 || !email) return;
    verifyOtp.mutate({ email, otp }, {
      onSuccess: (data) => {
        queryClient.clear();
        if (data.role === 'driver') {
          router.replace('/(driver)');
        } else {
          router.replace('/(parent)');
        }
      },
    });
  };

  const handleResend = () => {
    if (!email) return;
    resendOtp.mutate({ email });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-gray-900 mb-2">Check your email</Text>
      <Text className="text-gray-500 mb-8">
        We sent a 6-digit verification code to <Text className="font-semibold text-gray-900">{email}</Text>
      </Text>

      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">Verification Code</Text>
        <TextInput
          className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-center text-lg tracking-widest"
          placeholder="••••••"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      <TouchableOpacity
        className="w-full h-12 bg-primary-600 rounded-lg flex-row items-center justify-center mb-4"
        onPress={handleVerify}
        disabled={verifyOtp.isPending || otp.length !== 6}
      >
        {verifyOtp.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white font-semibold text-lg">Verify & Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={resendOtp.isPending}>
        <Text className="text-center text-primary-600 font-medium">
          {resendOtp.isPending ? 'Sending...' : 'Resend Code'}
        </Text>
      </TouchableOpacity>

      {(verifyOtp.isError || resendOtp.isError) && (
        <Text className="text-red-500 text-center mt-4 text-sm">
          {verifyOtp.error?.message || resendOtp.error?.message}
        </Text>
      )}
    </SafeAreaView>
  );
}
