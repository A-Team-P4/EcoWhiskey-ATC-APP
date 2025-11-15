import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TrainingConfiguration, TrainingContextResponse, TrainingSession } from '../interfaces/training';
import { createTrainingContext, deleteTrainingSession, getTrainingContextHistory } from '../services/apiClient';
import { SuccessResponse } from '../interfaces/user';

export const useCreateTrainingContext = () => {
  return useMutation<TrainingContextResponse, unknown, TrainingConfiguration>({
    mutationFn: (config) => createTrainingContext(config),
    onSuccess: (data) => {
      console.log('✅ Training context created:', data);
      console.log('📝 Training Session ID:', data.trainingSessionId);
    },
    onError: (error) => {
      console.error('❌ Failed to create training context:', error);
    },
  });
};

export const TRAINING_HISTORY_QUERY_KEY = (userId: string) =>
  ['training_context', 'history', userId] as const;

export const useTrainingContextHistory = (userId?: string) =>
  useQuery<TrainingSession[]>({
    queryKey: userId ? TRAINING_HISTORY_QUERY_KEY(userId) : ['training_context', 'history'],
    queryFn: () => getTrainingContextHistory(userId as string),
    enabled: Boolean(userId),
  });

export const useDeleteTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, unknown, string>({
    mutationFn: (sessionId: string) => deleteTrainingSession(sessionId),
    onSuccess: (data, sessionId) => {
      console.log('✅ Training session deleted:', sessionId);

      // Invalidate the training history query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['training_context', 'history'] });

      // Invalidate all scores queries since phase scores depend on sessions
      queryClient.invalidateQueries({ queryKey: ['scores'] });

      console.log('✅ Invalidated training history and scores queries');
    },
    onError: (error) => {
      console.error('❌ Failed to delete training session:', error);
    },
  });
};
