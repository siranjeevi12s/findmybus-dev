import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isAuthenticated, isLoading, restoreSession, role } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (role === 'driver') {
        router.replace('/(driver)');
      } else if (role === 'parent') {
        router.replace('/(parent)');
      }
    }
  }, [isAuthenticated, isLoading, segments, role, router]);

  if (isLoading) return null; // Or a splash screen component

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}
