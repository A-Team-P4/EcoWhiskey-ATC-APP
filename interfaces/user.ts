
export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: 'student' | 'instructor';
  schoolId?: number | string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface School {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SchoolCreateRequest {
  name: string;
  location?: string;
}

export interface SchoolUpdateRequest {
  name?: string;
  location?: string | null;
}

export interface UserGroupSummary {
  id: string;
  name: string;
  description?: string | null;
  instructorId?: string;
  role?: 'INSTRUCTOR' | 'ASSISTANT' | 'STUDENT';
  memberCount?: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: 'student' | 'instructor';
  school?: School | null;
  group?: UserGroupSummary | null;
  photo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accountType: string;
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export type UserResponse = User;

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  photo?: string | null;
}

export interface UpdateUserSchoolPayload {
  schoolId: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface SuccessResponse {
  message: string;
}

export type SchoolResponse = School;
export type SchoolsResponse = School[];
