
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

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  [key: string]: unknown;
}
