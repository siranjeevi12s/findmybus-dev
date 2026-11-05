// ─── Auth ───────────────────────────────────────────────────────────────────
export type UserRole = 'driver' | 'parent';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface MobileUser {
  userId: string;
  role: UserRole;
  email: string;
}

// ─── School ──────────────────────────────────────────────────────────────────
export interface School {
  _id: string;
  name: string;
  email: string;
}

// ─── Bus ─────────────────────────────────────────────────────────────────────
export interface Bus {
  _id: string;
  busNumber: string;
  registrationNumber: string;
  busType: string;
  capacity: number;
  status: string;
  schoolId: string | School;
}

// ─── Driver ──────────────────────────────────────────────────────────────────
export interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  schoolId: string | School;
  status: string;
}

// ─── Student ─────────────────────────────────────────────────────────────────
export interface Student {
  _id: string;
  studentName: string;
  studentId: string;
  grade: string;
  section: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  busId: string | Bus | null;
  schoolId: string | School;
  status: string;
}

// ─── Assignment ───────────────────────────────────────────────────────────────
export interface BusDriverAssignment {
  _id: string;
  schoolId: string;
  busId: Bus;
  driverId: Driver;
  assignedAt: string;
  status: string;
}

// ─── Trip ─────────────────────────────────────────────────────────────────────
export type TripStatus = 'active' | 'completed' | 'cancelled';

export interface Trip {
  _id: string;
  schoolId: string;
  busId: string | Bus;
  driverId: string | Driver;
  status: TripStatus;
  startedAt: string;
  endedAt?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  currentAccuracy?: number;
  currentSpeed?: number;
  currentHeading?: number;
  locationUpdatedAt?: string;
}

// ─── Location ─────────────────────────────────────────────────────────────────
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface BusLocation {
  active: boolean;
  tripId?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  updatedAt?: string;
}

export interface BusLocationHistory {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

// ─── Driver Profile ───────────────────────────────────────────────────────────
export interface DriverProfile {
  id: string;
  role: 'driver';
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  school: School;
}

// ─── Parent Profile ───────────────────────────────────────────────────────────
// GET /mobile/parent/profile returns the student document nested under
// `student`, alongside its resolved bus, driver and school.
export interface ParentProfile {
  student: Student;
  bus?: Bus | null;
  driver?: Driver | null;
  school: School;
  // studentname: string; // Added to match the updated code in index.tsx
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    field?: string;
    reason?: string;
  };
}
