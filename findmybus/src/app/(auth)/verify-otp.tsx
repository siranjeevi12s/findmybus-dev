import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVerifyOtp } from '../../hooks/auth/useVerifyOtp';
import { useSendOtp } from '../../hooks/auth/useSendOtp';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useSendOtp();

  // Countdown cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleVerify = () => {
    if (!otp || otp.length !== 6 || !email) return;
    verifyOtp.mutate({ email, otp }, {
      onSuccess: (data) => {
        if (data.role === 'driver') {
          router.replace('/(driver)');
        } else {
          router.replace('/(parent)');
        }
      },
    });
  };

  const handleResend = () => {
    if (!email || resendCooldown > 0) return;
    resendOtp.mutate(email, {
      onSuccess: () => {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      },
    });
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
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

      <TouchableOpacity onPress={handleResend} disabled={resendOtp.isPending || resendCooldown > 0}>
        <Text className="text-center text-primary-600 font-medium">
          {resendOtp.isPending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
        </Text>
      </TouchableOpacity>

      {(verifyOtp.isError || resendOtp.isError) && (
        <Text className="text-red-500 text-center mt-4 text-sm">
          {verifyOtp.error?.message || resendOtp.error?.message}
        </Text>
      )}
    </View>
  );
}
