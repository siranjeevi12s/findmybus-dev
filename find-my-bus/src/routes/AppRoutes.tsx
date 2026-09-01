import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Pages lazy loads or direct imports
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyOtp from '../pages/auth/VerifyOtp';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome from '../pages/dashboard/DashboardHome';
import BusesPage from '../pages/buses/BusesPage';
import DriversPage from '../pages/drivers/DriversPage';
import AssignmentsPage from '../pages/assignments/AssignmentsPage';
import StudentsPage from '../pages/students/StudentsPage';

// Route guards
const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public / Auth routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-otp"
        element={
          <PublicRoute>
            <VerifyOtp />
          </PublicRoute>
        }
      />

      {/* Protected dashboard routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="buses" element={<BusesPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
