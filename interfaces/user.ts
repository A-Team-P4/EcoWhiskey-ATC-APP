
export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: 'student' | 'instructor';
  school?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: 'student' | 'instructor';
  school?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}
