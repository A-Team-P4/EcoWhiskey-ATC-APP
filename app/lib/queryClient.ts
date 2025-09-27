import { QueryClient } from '@tanstack/react-query';


interface ApiError {
  message: string;
  status?: number;
  code?: string;
}


export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if ((error as ApiError)?.status && (error as ApiError).status! >= 400 && (error as ApiError).status! < 500) {
          return false;
        }

        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, 
      gcTime: 10 * 60 * 1000, 
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        if ((error as ApiError)?.status && (error as ApiError).status! >= 400 && (error as ApiError).status! < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
