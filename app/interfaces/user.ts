
export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: 'student' | 'instructor';
  school?: string;
}