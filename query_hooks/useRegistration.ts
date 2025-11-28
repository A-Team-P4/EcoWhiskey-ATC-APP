import { useMutation } from "@tanstack/react-query";
import { RegistrationData } from "../interfaces/user";
import { registerUser } from "../services/apiClient";


export const useRegistration = () => {
  return useMutation({
    mutationFn: (userData: RegistrationData) => registerUser(userData),
    onSuccess: (data) => {
      console.log('Registration successful:', data);
      // You can add more success logic here like storing tokens
    },
    onError: (error) => {
      console.log('Registration failed:', error);
    },
  });
};