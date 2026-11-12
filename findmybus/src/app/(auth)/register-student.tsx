import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { parentApi } from '../../api/parentApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SCHOOL_NAME = 'siranjeevi';
const SCHOOL_EMAIL = 'siranjeevi12s2@gmail.com';

export default function RegisterStudentScreen() {
  const [form, setForm] = useState({
    studentName: '',
    studentId: '',
    grade: '',
    section: '',
    parentName: '',
    email: '',
    parentPhone: '',
    busNumber: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    const {
      studentName, studentId, grade, section, parentName, email, parentPhone, busNumber,
    } = form;

    if (!studentName || !studentId || !grade || !section || !parentName ||
        !email || !parentPhone || !busNumber) {
      return;
    }
    if (!EMAIL_REGEX.test(email)) return;

    setError('');
    try {
      await parentApi.createStudent({
        studentName,
        studentId,
        grade,
        section,
        parentName,
        parentEmail: email,
        parentPhone,
        busNumber: busNumber.trim(),
        schoolName: SCHOOL_NAME,
        schoolEmail: SCHOOL_EMAIL,
      });
      (router.replace as any)(`/(auth)/register-success?email=${encodeURIComponent(email)}&school=${encodeURIComponent(SCHOOL_NAME)}`);
    } catch (e) {
      const apiMessage = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(
        apiMessage ||
          (e instanceof Error && e.message
            ? e.message
            : 'Could not create the student profile. Please check your details and try again.'),
      );
    }
  };

  const field = (label: string, placeholder: string, key: keyof typeof form, keyboard?: any) => (
    <View className="mb-5" key={key}>
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <TextInput
        className="w-full h-11 px-3 border border-gray-300 rounded bg-gray-50 text-gray-900"
        placeholder={placeholder}
        value={form[key]}
        onChangeText={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
        keyboardType={keyboard}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      className="px-6 bg-white"
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="mb-8">
          <Text className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">
            {SCHOOL_NAME}
          </Text>
          <Text className="text-2xl font-bold text-gray-900 mb-1">Register Student</Text>
          <Text className="text-gray-500">Fill in the details to create a student profile.</Text>
        </View>

        <View className="flex-row gap-4 mb-5">
          {field('Student Name', 'e.g. John Doe', 'studentName')}
          {field('Student ID', 'e.g. S1234', 'studentId')}
        </View>

        <View className="flex-row gap-4 mb-5">
          {field('Grade', 'e.g. 5', 'grade')}
          {field('Section', 'e.g. A', 'section')}
        </View>

        {field('Parent Name', 'e.g. Jane Doe', 'parentName')}

        <View className="flex-row gap-4 mb-5">
          {field('Parent Email', 'parent@school.com', 'email', 'email-address')}
          {field('Parent Phone', '+1234567890', 'parentPhone', 'phone-pad')}
        </View>

        {field('Bus Number', 'e.g. 101', 'busNumber', 'number-pad')}

        <TouchableOpacity
          className="w-full h-11 bg-primary-600 rounded-lg flex-row items-center justify-center"
          disabled={
            !form.studentName || !form.studentId || !form.grade || !form.section ||
            !form.parentName || !form.email || !form.parentPhone || !form.busNumber ||
            !EMAIL_REGEX.test(form.email)
          }
          onPress={handleRegister}
        >
          <Text className="text-white font-semibold text-lg">Create Student Profile</Text>
        </TouchableOpacity>

        {!!error && (
          <Text className="text-red-500 text-center mt-4 text-sm">{error}</Text>
        )}

        <Text className="text-gray-400 text-center mt-6 text-sm">
          Already have an account?{' '}
          <Text className="text-primary-600 font-medium" onPress={() => router.push('/(auth)/login')}>
            Login
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
