import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  loginSchool,
  registerSchool,
  verifyOtp,
  resendOtp,
  logoutSchool,
  getMe,
  SchoolData,
  LoginPayload,
  RegisterPayload,
  VerifyOtpPayload,
} from '../api/authApi';

interface AuthContextType {
  school: SchoolData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verify: (payload: VerifyOtpPayload) => Promise<void>;
  resend: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Load user profile if access token is available
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getMe();
        if (response.success && response.data.school) {
          setSchool(response.data.school);
          setIsAuthenticated(true);
        } else {
          // Token is invalid
          localStorage.clear();
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();

    // Listen to token refresh expiration logout event from Axios client
    const handleForceLogout = () => {
      setSchool(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth-logout', handleForceLogout);
    return () => {
      window.removeEventListener('auth-logout', handleForceLogout);
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: loginSchool,
    onSuccess: (response) => {
      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        setSchool(response.data.school);
        setIsAuthenticated(true);
      }
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (response) => {
      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        setSchool(response.data.school);
        setIsAuthenticated(true);
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerSchool,
  });

  const resendMutation = useMutation({
    mutationFn: resendOtp,
  });

  const login = async (payload: LoginPayload) => {
    await loginMutation.mutateAsync(payload);
  };

  const register = async (payload: RegisterPayload) => {
    await registerMutation.mutateAsync(payload);
  };

  const verify = async (payload: VerifyOtpPayload) => {
    await verifyMutation.mutateAsync(payload);
  };

  const resend = async (email: string) => {
    await resendMutation.mutateAsync(email);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await logoutSchool(refreshToken);
      } catch (error) {
        console.error('Logout error on backend:', error);
      }
    }
    localStorage.clear();
    setSchool(null);
    setIsAuthenticated(false);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        school,
        isAuthenticated,
        isLoading,
        login,
        register,
        verify,
        resend,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
